/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const fs = require('fs');
const inquirer = require('inquirer');

const Config = require('@adobe/aio-lib-core-config');
const { getToken, context } = require('@adobe/aio-lib-ims');
const { CLI } = require('@adobe/aio-lib-ims/src/context');
const libConsoleCLI = require('@adobe/aio-cli-lib-console');
const { getCliEnv } = require('@adobe/aio-lib-env');
const aioConsoleLogger = require('@adobe/aio-lib-core-logging')('@adobe/aio-cli-plugin-api-mesh', {
	provider: 'debug',
});

const { SchemaServiceClient } = require('./classes/SchemaServiceClient');
const logger = require('../src/classes/logger');
const { UUID } = require('./classes/UUID');
const CONSTANTS = require('./constants');

const { DEV_CONSOLE_BASE_URL, DEV_CONSOLE_API_KEY, AIO_CLI_API_KEY } = CONSTANTS;

/**
 * @returns {any} Returns a config object or null
 */
async function getDevConsoleConfig() {
	const configFile = Config.get('api-mesh.configPath');

	if (!configFile) {
		return {
			baseUrl: DEV_CONSOLE_BASE_URL,
			accessToken: (await getLibConsoleCLI()).accessToken,
			apiKey: DEV_CONSOLE_API_KEY,
		};
	} else {
		try {
			if (!fs.existsSync(configFile)) {
				throw new Error(
					`Config file does not exist. Please run the command: aio config:set api-mesh.configPath <path_to_json_file> with a valid file.`,
				);
			}

			const data = JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8', flag: 'r' }));

			if (!data.baseUrl || !data.apiKey) {
				throw new Error(
					'Invalid config file. Please validate the file contents and try again. Config file must contain baseUrl and apiKey.',
				);
			}

			const baseUrl = data.baseUrl.endsWith('/')
				? data.baseUrl.slice(0, data.baseUrl.length - 1)
				: data.baseUrl;

			return {
				baseUrl: baseUrl,
				accessToken: (await getLibConsoleCLI()).accessToken,
				apiKey: data.apiKey,
			};
		} catch (error) {
			logger.error(
				'Please run the command: aio config:set api-mesh.configPath <path_to_json_file> with a valid config file.',
			);

			throw new Error(error);
		}
	}
}

/**
 * @returns {string} Returns organizations the user belongs to
 */
async function getAuthorizedOrganization() {
	const { consoleCLI } = await getLibConsoleCLI();

	aioConsoleLogger.debug('Get the selected organization');

	const consoleConfigOrg = Config.get('console.org');

	if (!consoleConfigOrg) {
		const organizations = await consoleCLI.getOrganizations();
		const selectedOrg = await consoleCLI.promptForSelectOrganization(organizations);

		aioConsoleLogger.debug('Set the console config');

		Config.set('console.org', {
			id: selectedOrg.id,
			code: selectedOrg.code,
			name: selectedOrg.name,
		});

		return Object.assign({}, selectedOrg);
	} else {
		logger.info(`Selecting your organization as: ${consoleConfigOrg.name}`);

		return Object.assign({}, consoleConfigOrg);
	}
}

async function getProject(imsOrgId, imsOrgTitle) {
	logger.info(`Initializing project selection for ${imsOrgId}`);

	const { consoleCLI } = await getLibConsoleCLI();

	const projects = await consoleCLI.getProjects(imsOrgId);
	if (projects.length !== 0) {
		const selectedProject = await consoleCLI.promptForSelectProject(projects);

		return selectedProject;
	} else {
		aioConsoleLogger.error(`No projects found for the selected organization: ${imsOrgTitle}`);
	}
}

async function getWorkspace(orgId, projectId, imsOrgTitle, projectTitle) {
	logger.info(`Initializing workspace selection for ${orgId} / ${projectId}`);

	const { consoleCLI } = await getLibConsoleCLI();

	const workspaces = await consoleCLI.getWorkspaces(orgId, projectId);
	if (workspaces.length !== 0) {
		const selectedWorkspace = await consoleCLI.promptForSelectWorkspace(workspaces);

		return selectedWorkspace;
	} else {
		aioConsoleLogger.error(
			`No workspaces found for the selected organization: ${imsOrgTitle} and project: ${projectTitle}`,
		);
	}
}

/**
 * @private
 */
async function getLibConsoleCLI() {
	await context.setCli({ 'cli.bare-output': true }, false);

	const clientEnv = getCliEnv();

	const accessToken = await getToken(CLI);

	const consoleCLI = await libConsoleCLI.init({
		accessToken: accessToken,
		apiKey: AIO_CLI_API_KEY,
		env: clientEnv,
	});

	return { consoleCLI: consoleCLI, accessToken: accessToken };
}

/**
 * @returns {any} Returns an object with properties ready for consumption
 */
async function initSdk() {
	const org = await getAuthorizedOrganization();
	const project = await getProject(org.id, org.name);
	const workspace = await getWorkspace(org.id, project.id, org.name, project.title);

	aioConsoleLogger.log(
		`Initializing SDK for org: ${org.name}, project: ${project.title} and workspace: ${workspace.title}`,
	);

	logger.info('Initialized user login and the selected organization');

	const { baseUrl, accessToken, apiKey } = await getDevConsoleConfig();

	const schemaServiceClient = new SchemaServiceClient();
	schemaServiceClient.init(baseUrl, accessToken, apiKey);

	return {
		schemaServiceClient: schemaServiceClient,
		imsOrgId: org.id,
		projectId: project.id,
		workspaceId: workspace.id,
	};
}

/**
 * Generates a static global requestid for the lifecycle of this command request
 */
async function initRequestId() {
	global.requestId = UUID.newUuid().toString();
}

/**
 * Function to run the CLI Y/N prompt to confirm the user's action
 *
 * @param {string} message
 *
 * @returns boolean
 */
async function promptConfirm(message) {
	const prompt = inquirer.createPromptModule({ output: process.stderr });

	const confirm = await prompt([
		{
			type: 'confirm',
			name: 'res',
			message,
		},
	]);

	return confirm.res;
}

module.exports = {
	promptConfirm,
	getLibConsoleCLI,
	getDevConsoleConfig,
	initSdk,
	initRequestId,
};
