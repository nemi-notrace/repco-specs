import { DMMF } from '@prisma/generator-helper'
import { SourceFile } from 'ts-morph'

function hasEntityAnnotation(docstring?: string) {
  if (!docstring) return false
  const lines = docstring.split('\n')
  for (const line of lines) {
    if (line.match(/\s*@repco\(Entity\)\s*/g)) return true
  }
  return false
}

function isRepcoEntity(model: DMMF.Model) {
  return hasEntityAnnotation(model.documentation)
}

export function generateTypes(dmmf: DMMF.Document, file: SourceFile) {
  const imports = ['PrismaClient', 'PrismaPromise', 'Prisma']
  const entityModels = dmmf.datamodel.models.filter(isRepcoEntity)
  for (const model of entityModels) {
    generateModelTypes(model, file)
    imports.push(model.name)
  }
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: imports,
  })
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    defaultImport: '* as prisma',
  })
  file.addImportDeclaration({
    moduleSpecifier: 'repco-common/zod',
    defaultImport: '* as common',
  })
  file.addImportDeclaration({
    moduleSpecifier: './zod.js',
    defaultImport: '* as form',
  })
  generateEntityTypes(entityModels, file)
  generateValidateFunction(entityModels, file)
  generateUpsertFunction(entityModels, file)
  generateUpsertFunction2(entityModels, file)
  generateExtractRelationsFunction(entityModels, file)
}

function generateEntityTypes(models: DMMF.Model[], file: SourceFile) {
  const inputTys = []
  const outputTys = []
  for (const model of models) {
    if (!isRepcoEntity(model)) continue
    inputTys.push(`{
			type: "${model.name}",
			content: form.${model.name}Input
    }`)
    outputTys.push(`{
			type: "${model.name}",
			content: prisma.${model.name}
    }`)
  }
  file.addTypeAlias({
    name: `EntityInput`,
    type: inputTys.join(' | '),
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityInputWithUid`,
    type: `EntityInput & { uid: common.Uid }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityInputWithUidAndRevisionId`,
    type: `EntityInput & { uid: common.Uid, revisionId: string }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityOutput`,
    type: outputTys.join(' | '),
    isExported: true,
  })
}

function generateValidateFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `input.revisionId = revisionId
		switch (type) {`
  for (const model of models) {
    code += `
			case '${model.name}': {
				const content = form.${parser}.parse(input)
				return { type, content } as EntityInput
			}`
  }
  code += `
	   default: {
				throw new Error('Unsupported entity type: ' + type)
	    }
		}
		`

  file.addFunction({
    isExported: true,
    name: 'parseEntity',
    parameters: [
      { name: 'type', type: 'string' },
      { name: 'input', type: 'unknown' },
    ],
    returnType: 'EntityInput',
    statements: code,
  })
}

function generateExtractRelationsFunction(
  models: DMMF.Model[],
  file: SourceFile,
) {
  let code = `
    switch (input.type) {
  `
  for (const model of models) {
    const uidFields = findUidFields(model)
    let inner = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        const path = `content.${field.name}`
        const values = field.isList
          ? `${path}.filter(x => x !== null)`
          : `[${path}]`
        inner += `
          if (${path} !== undefined && ${path} !== null) {
            relations.push({
              uid: input.uid,
              type: input.type,
              field: '${field.name}',
              targetType: '${field.type}',
              multiple: ${JSON.stringify(field.isList)},
              values: ${values},
            })
          }
        `
      }
    }
    code += `
			case '${model.name}': {
        const relations: Relation[] = []
        const content = input.content as ${model.name}Input
        ${inner}
        return relations
      }
      `
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + input.type)
		}`
  file.addTypeAlias({
    name: `Relation`,
    type: `{
      fieldName: string,
      targetType: string,
      values?: string[],
      isList: boolean
    }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityLike`,
    type: `{
      type: string,
      content: {
        uid: string
      },
    }`,
    isExported: true,
  })
  file.addFunction({
    isExported: true,
    isAsync: false,
    name: 'extractRelations',
    parameters: [{ name: 'input', type: 'EntityLike' }],
    returnType: 'Relation[]',
    statements: code,
  })
}

function lowerName(model: DMMF.Model): string {
  return model.name[0].toLowerCase() + model.name.substring(1)
}

function generateUpsertFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
	const uid = input.content.uid
	let entity: EntityOutput
	switch (type) {`
  for (const model of models) {
    const uidFields = findUidFields(model)
    let transform = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        // if (field.relationFromFields) {
        //   for (const uidFieldName of field.relationFromFields) {
        //     transform += `${uidFieldName}: undefined,`
        //   }
        // }
        const path = `input.content.${field.name}`
        let valueExpr, uidPath
        if (field.isList) {
          valueExpr = `${path}.filter(link => link.uid).map(link => ({ uid: link.uid }))`
          uidPath = `(${path}?.length && ${path}[0].uid)`
        } else {
          valueExpr = `{ uid: ${path}.uid }`
          uidPath = `${path}?.uid`
        }
        assignStmt += `
          ${field.name}: ${uidPath} ? { connect: ${valueExpr} } : {},`
      }
    }
    code += `
			case '${model.name}': {
        const data = {
          ...input.content,
          uid,
          Revision: { connect: { id: revisionId }},
          ${assignStmt}
        }
				return prisma.${lowerName(model)}.upsert({
					where: { uid },
					create: data,
          update: data,
          select: { uid: true }
				})
			}
			`
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + type)
		}
		`
  file.addFunction({
    isExported: true,
    name: 'upsertEntity',
    parameters: [
      { name: 'prisma', type: 'Prisma.TransactionClient' },
      { name: 'uid', type: 'string' },
      { name: 'revisionId', type: 'string' },
      { name: 'input', type: 'EntityInput' },
    ],
    returnType: 'PrismaPromise<any>',
    statements: code,
  })
}

function generateUpsertFunction2(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
	const uid = input.content.uid
	switch (type) {`
  for (const model of models) {
    const uidFields = findUidFields(model)
    let transform = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        // if (field.relationFromFields) {
        //   for (const uidFieldName of field.relationFromFields) {
        //     transform += `${uidFieldName}: undefined,`
        //   }
        // }
        const path = `input.content.${field.name}`
        let inner
        if (field.isList) {
          inner = `${path}?.map(uid => ({ uid }))`
        } else {
          inner = `{ uid: ${path}! }`
        }
        transform += `
					${field.name}: ${path} ? {
						connect: ${inner}
          } : {},`
      }
    }
    code += `
			case '${model.name}': {
        const data = {
          ...input.content,
          revision: { connect: { id: revisionId }},
          ${transform}
        }
				return prisma.${lowerName(model)}.upsert({
					where: { uid },
					create: data,
          update: data,
          select: {}
				})
			}
			`
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + type)
		}
		`
  file.addFunction({
    isExported: true,
    // isAsync: true,
    name: 'upsertEntity2',
    parameters: [
      { name: 'prisma', type: 'PrismaClient' },
      { name: 'input', type: 'EntityInput' },
      { name: 'revisionId', type: 'string' },
    ],
    returnType: 'PrismaPromise<any>',
    statements: code,
  })
}

// function hasRevisionId(model: DMMF.Model): boolean {
//   return !!model.fields.find((field) => field.name === 'revisionId')
// }

function findUidFields(model: DMMF.Model): DMMF.Field[] {
  const res = []
  for (const field of model.fields) {
    if (
      field.kind === 'object' &&
      field.type !== 'Revision'
      // && field.isList
      // && field.relationToFields?.length
      // && field.relationToFields[0] === 'uid'
    ) {
      res.push(field)
    }
  }
  return res
}
