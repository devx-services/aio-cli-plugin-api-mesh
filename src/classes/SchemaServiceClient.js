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

const axios = require('axios');
const logger = require('../classes/logger');
const { objToString } = require('../utils');

/**
 * This class provides methods to call Schema Management Service APIs.
 * Before calling any method initialize the instance by calling the `init` method on it
 * with valid values for baseUrl, apiKey and accessToken
 */
class SchemaServiceClient {
	init(baseUrl, accessToken, apiKey) {
		this.devConsoleUrl = baseUrl;
		this.accessToken = accessToken;
		this.apiKey = apiKey;
	}

	async getMesh(organizationId, projectId, workspaceId, meshId) {
		const config = {
			method: 'get',
			url: `${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
			headers: {
				'Authorization': `Bearer ${this.accessToken}`,
				'x-request-id': global.requestId,
			},
		};

		logger.info(
			'Initiating GET %s',
			`${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
		);

		try {
			const response = await axios(config);

			logger.info('Response from GET %s', response.status);

			if (response && response.status === 200) {
				logger.info(`Mesh Config : ${objToString(response, ['data'])}`);

				return response.data;
			} else {
				// Non 200 response received
				logger.error(
					`Something went wrong: ${objToString(
						response,
						['data'],
						'Unable to get mesh',
					)}. Received ${response.status} response instead of 200`,
				);

				throw new Error(
					`Something went wrong: ${objToString(response, ['data'], 'Unable to get mesh')}`,
				);
			}
		} catch (error) {
			logger.info('Response from GET %s', error.response.status);

			if (error.response.status === 404) {
				// The request was made and the server responded with a 404 status code
				logger.error('Mesh not found');

				return null;
			} else if (error.response && error.response.data) {
				// The request was made and the server responded with an unsupported status code
				logger.error(
					'Error while getting mesh. Response: %s',
					objToString(error, ['response', 'data'], 'Unable to get mesh'),
				);

				if (error.response.data.messages) {
					const message = objToString(
						error,
						['response', 'data', 'messages'],
						'Unable to get mesh',
					);

					throw new Error(message);
				} else if (error.response.data.message) {
					const message = objToString(error, ['response', 'data', 'message'], 'Unable to get mesh');

					throw new Error(message);
				} else {
					const message = objToString(error, ['response', 'data'], 'Unable to get mesh');

					throw new Error(message);
				}
			} else {
				// The request was made but no response was received
				logger.error(
					'Error while getting mesh. No response received from the server: %s',
					objToString(error, [], 'Unable to get mesh'),
				);

				throw new Error('Unable to get mesh from Schema Management Service: %s', error.message);
			}
		}
	}

	async createMesh(organizationId, projectId, workspaceId, data) {
		const config = {
			method: 'post',
			url: `${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes?API_KEY=${this.apiKey}`,
			headers: {
				'Authorization': `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
				'x-request-id': global.requestId,
			},
			data: JSON.stringify(data),
		};

		logger.info(
			'Initiating POST %s',
			`${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes?API_KEY=${this.apiKey}`,
		);

		try {
			const response = await axios(config);

			logger.info('Response from POST %s', response.status);

			if (response && response.status === 201) {
				logger.info(`Mesh Config : ${objToString(response, ['data'])}`);

				return response.data;
			} else {
				// Non 201 response received
				logger.error(
					`Something went wrong: ${objToString(
						response,
						['data'],
						'Unable to create mesh',
					)}. Received ${response.status} response instead of 201`,
				);

				throw new Error(response.data.message);
			}
		} catch (error) {
			if (error.response.status === 409) {
				// The request was made and the server responded with a 409 status code
				logger.error('Error while creating mesh: %j', error.response.data);

				throw new Error('Selected org, project and workspace already has a mesh');
			} else if (error.response && error.response.data) {
				// The request was made and the server responded with an unsupported status code
				logger.error(
					'Error while creating mesh. Response: %s',
					objToString(error, ['response', 'data'], 'Unable to create mesh'),
				);

				if (error.response.data.messages) {
					const message = objToString(
						error,
						['response', 'data', 'messages'],
						'Unable to create mesh',
					);

					throw new Error(message);
				} else if (error.response.data.message) {
					const message = objToString(
						error,
						['response', 'data', 'message'],
						'Unable to create mesh',
					);

					throw new Error(message);
				} else {
					const message = objToString(error, ['response', 'data'], 'Unable to create mesh');

					throw new Error(message);
				}
			} else {
				// The request was made but no response was received
				logger.error(
					'Error while creating mesh. No response received from the server: %s',
					objToString(error, [], 'Unable to create mesh'),
				);

				throw new Error('Unable to create mesh in Schema Management Service: %s', error.message);
			}
		}
	}

	async updateMesh(organizationId, projectId, workspaceId, meshId, data) {
		const config = {
			method: 'put',
			url: `${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
			headers: {
				'Authorization': `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
				'x-request-id': global.requestId,
			},
			data: JSON.stringify(data),
		};

		logger.info(
			'Initiating PUT %s',
			`${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
		);

		try {
			const response = await axios(config);

			logger.info('Response from POST %s', response.status);

			if (response && response.status === 204) {
				return response.data;
			} else {
				// Non 204 response received
				logger.error(
					`Something went wrong: ${objToString(
						response,
						['data'],
						'Unable to update mesh',
					)}. Received ${response.status} response instead of 204`,
				);

				throw new Error(
					`Something went wrong: ${objToString(response, ['data'], 'Unable to update mesh')}`,
				);
			}
		} catch (error) {
			logger.info('Response from PUT %s', error.response.status);

			if (error.response.status === 404) {
				// The request was made and the server responded with a 404 status code
				logger.error('Mesh not found');

				throw new Error('Mesh not found');
			} else if (error.response && error.response.data) {
				// The request was made and the server responded with an unsupported status code
				logger.error(
					'Error while updating mesh. Response: %s',
					objToString(error, ['response', 'data'], 'Unable to update mesh'),
				);

				if (error.response.data.messages) {
					const message = objToString(
						error,
						['response', 'data', 'messages'],
						'Unable to update mesh',
					);

					throw new Error(message);
				} else if (error.response.data.message) {
					const message = objToString(
						error,
						['response', 'data', 'message'],
						'Unable to update mesh',
					);

					throw new Error(message);
				} else {
					const message = objToString(error, ['response', 'data'], 'Unable to update mesh');

					throw new Error(message);
				}
			} else {
				// The request was made but no response was received
				logger.error(
					'Error while updating mesh. No response received from the server: %s',
					objToString(error, [], 'Unable to update mesh'),
				);

				throw new Error('Unable to update mesh from Schema Management Service: %s', error.message);
			}
		}
	}

	async deleteMesh(organizationId, projectId, workspaceId, meshId) {
		const config = {
			method: 'delete',
			url: `${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
			headers: {
				'Authorization': `Bearer ${this.accessToken}`,
				'x-request-id': global.requestId,
			},
		};

		logger.info(
			'Initiating DELETE %s',
			`${this.devConsoleUrl}/organizations/${organizationId}/projects/${projectId}/workspaces/${workspaceId}/meshes/${meshId}?API_KEY=${this.apiKey}`,
		);

		try {
			const response = await axios(config);

			logger.info('Response from DELETE %s', response.status);

			if (response && response.status === 204) {
				return response;
			} else {
				// Non 204 response received
				logger.error(
					`Something went wrong: ${objToString(
						response,
						['data'],
						'Unable to delete mesh',
					)}. Received ${response.status} response instead of 204`,
				);

				throw new Error(
					`Something went wrong: ${objToString(response, ['data'], 'Unable to delete mesh')}`,
				);
			}
		} catch (error) {
			logger.info('Response from DELETE %s', error.response.status);

			if (error.response.status === 404) {
				// The request was made and the server responded with a 404 status code
				logger.error('Mesh not found');

				throw new Error('Mesh not found');
			} else if (error.response && error.response.data) {
				// The request was made and the server responded with an unsupported status code
				logger.error(
					'Error while deleting mesh. Response: %s',
					objToString(error, ['response', 'data'], 'Unable to delete mesh'),
				);

				if (error.response.data.messages) {
					const message = objToString(
						error,
						['response', 'data', 'messages'],
						'Unable to delete mesh',
					);

					throw new Error(message);
				} else if (error.response.data.message) {
					const message = objToString(
						error,
						['response', 'data', 'message'],
						'Unable to delete mesh',
					);

					throw new Error(message);
				} else {
					const message = objToString(error, ['response', 'data'], 'Unable to delete mesh');

					throw new Error(message);
				}
			} else {
				// The request was made but no response was received
				logger.error(
					'Error while deleting mesh. No response received from the server: %s',
					objToString(error, [], 'Unable to delete mesh'),
				);

				throw new Error('Unable to delete mesh from Schema Management Service: %s', error.message);
			}
		}
	}
}

module.exports = { SchemaServiceClient };
