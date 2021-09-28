const { Command } = require('@oclif/command')
const { SchemaServiceClient } = require('../../../classes/SchemaServiceClient')

class GetCommand extends Command {
  static args = [
    {name: 'tenantId'}
  ]
  async run() {
    const { args } = this.parse(GetCommand)
    let schemaServiceClient = new SchemaServiceClient()
    const tenant = await schemaServiceClient.getTenant(args.tenantId)
    tenant ? console.log(JSON.stringify(tenant)):
    console.log(`Unable to retrieve the tenant config for ${args.tenantId}`)
  }
}

GetCommand.description = `Get the config of a given tenant`

module.exports = GetCommand
