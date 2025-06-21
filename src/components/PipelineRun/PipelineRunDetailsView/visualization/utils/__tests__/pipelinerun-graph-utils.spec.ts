import { PipelineRunKind, TaskRunKind } from '../../../../../../types';
import { runStatus } from '../../../../../../utils/pipeline-utils';
import { getPipelineRunDataModel } from '../pipelinerun-graph-utils';

describe('pipelinerun-graph-utils', () => {
  describe('getPipelineRunDataModel with matrix tasks', () => {
    it('should create separate nodes for each matrix task run', () => {
      // Mock pipeline run with matrix task
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'test-ns',
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64', 'linux/s390x'],
                    },
                  ],
                },
              },
            ],
          },
        },
        status: {
          pipelineSpec: {
            tasks: [
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64', 'linux/s390x'],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      // Mock task runs for matrix combinations
      const taskRuns: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-container-0',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-container',
            },
          },
          spec: {
            taskRef: {
              name: 'buildah',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-container-1',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-container',
            },
          },
          spec: {
            taskRef: {
              name: 'buildah',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-container-2',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-container',
            },
          },
          spec: {
            taskRef: {
              name: 'buildah',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
      ];

      const result = getPipelineRunDataModel(pipelineRun, taskRuns);

      expect(result).toBeTruthy();
      expect(result.nodes).toHaveLength(3); // Should have 3 nodes for the 3 matrix combinations
      expect(result.nodes.map((node) => node.id)).toEqual([
        'build-container  (linux/amd64)',
        'build-container  (linux/arm64)',
        'build-container  (linux/s390x)',
      ]);

      // Find specific nodes
      const buildContainer0 = result.nodes.find((node) => node.id === 'build-container  (linux/amd64)');
      const buildContainer1 = result.nodes.find((node) => node.id === 'build-container  (linux/arm64)');
      const buildContainer2 = result.nodes.find((node) => node.id === 'build-container  (linux/s390x)');

      // Test that matrix tasks are created correctly
      expect(buildContainer0).toBeTruthy();
      expect(buildContainer1).toBeTruthy();
      expect(buildContainer2).toBeTruthy();
      expect(buildContainer0.data.status).toBe(runStatus.Idle);
      expect(buildContainer1.data.status).toBe(runStatus.Idle);
      expect(buildContainer2.data.status).toBe(runStatus.Idle);
    });

    it('should handle initial render when TaskRuns do not exist yet', () => {
      // Mock pipeline run with matrix task but no TaskRuns yet
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'test-ns',
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64'],
                    },
                  ],
                },
              },
            ],
          },
        },
        status: {
          pipelineSpec: {
            tasks: [
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64'],
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      // No TaskRuns yet
      const taskRuns: TaskRunKind[] = [];

      const result = getPipelineRunDataModel(pipelineRun, taskRuns);

      expect(result).toBeTruthy();
      expect(result.nodes).toHaveLength(2); // Should have 2 nodes for the 2 matrix combinations
      expect(result.nodes.map((node) => node.id)).toEqual([
        'build-container  (linux/amd64)',
        'build-container  (linux/arm64)',
      ]);
    });

    it('should handle matrix tasks with dependencies correctly', () => {
      // Mock pipeline run with matrix task that has dependencies
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'test-ns',
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'init',
                taskRef: {
                  name: 'init-task',
                },
              },
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                runAfter: ['init'],
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64'],
                    },
                  ],
                },
              },
              {
                name: 'deploy',
                taskRef: {
                  name: 'deploy-task',
                },
                runAfter: ['build-container'],
              },
            ],
          },
        },
        status: {
          pipelineSpec: {
            tasks: [
              {
                name: 'init',
                taskRef: {
                  name: 'init-task',
                },
              },
              {
                name: 'build-container',
                taskRef: {
                  name: 'buildah',
                },
                runAfter: ['init'],
                matrix: {
                  params: [
                    {
                      name: 'platform',
                      value: ['linux/amd64', 'linux/arm64'],
                    },
                  ],
                },
              },
              {
                name: 'deploy',
                taskRef: {
                  name: 'deploy-task',
                },
                runAfter: ['build-container'],
              },
            ],
          },
        },
      };

      // Mock task runs
      const taskRuns: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-init',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'init',
            },
          },
          spec: {
            taskRef: {
              name: 'init-task',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-container-0',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-container',
            },
          },
          spec: {
            taskRef: {
              name: 'buildah',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-container-1',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-container',
            },
          },
          spec: {
            taskRef: {
              name: 'buildah',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-deploy',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'deploy',
            },
          },
          spec: {
            taskRef: {
              name: 'deploy-task',
            },
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: 'Succeeded',
              },
            ],
          },
        },
      ];

      const result = getPipelineRunDataModel(pipelineRun, taskRuns);

      expect(result).toBeTruthy();
      expect(result.nodes).toHaveLength(4); // init + 2 matrix tasks + deploy
      expect(result.nodes.map((node) => node.id)).toEqual([
        'init',
        'build-container  (linux/amd64)',
        'build-container  (linux/arm64)',
        'deploy',
      ]);

      // Find specific nodes
      const init = result.nodes.find((node) => node.id === 'init');
      const buildContainer0 = result.nodes.find((node) => node.id === 'build-container  (linux/amd64)');
      const buildContainer1 = result.nodes.find((node) => node.id === 'build-container  (linux/arm64)');
      const deploy = result.nodes.find((node) => node.id === 'deploy');
      
      // Test correct dependencies
      expect(buildContainer0.runAfterTasks).toContain('init');
      expect(buildContainer1.runAfterTasks).toContain('init');
      expect(deploy.runAfterTasks).toContain('build-container  (linux/amd64)');
      expect(deploy.runAfterTasks).toContain('build-container  (linux/arm64)');

      // Test that init is not connected to deploy
      expect(init.runAfterTasks).not.toContain('deploy');
    });

    it('should handle complex pipeline with matrix tasks and multiple dependencies correctly', () => {
      // Mock pipeline run that replicates the real pipeline structure
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-pipeline-run',
          namespace: 'test-ns',
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'init',
                taskRef: {
                  name: 'init-task',
                },
              },
              {
                name: 'clone-repository',
                taskRef: {
                  name: 'git-clone-task',
                },
                runAfter: ['init'],
              },
              {
                name: 'prefetch-dependencies',
                taskRef: {
                  name: 'prefetch-task',
                },
                runAfter: ['clone-repository'],
              },
              {
                name: 'build-images',
                taskRef: {
                  name: 'buildah-task',
                },
                runAfter: ['prefetch-dependencies'],
                matrix: {
                  params: [
                    {
                      name: 'PLATFORM',
                      value: ['linux/x86_64', 'linux/arm64'],
                    },
                  ],
                },
              },
              {
                name: 'build-image-index',
                taskRef: {
                  name: 'build-index-task',
                },
                runAfter: ['build-images'],
              },
              {
                name: 'deprecated-base-image-check',
                taskRef: {
                  name: 'deprecated-check-task',
                },
                runAfter: ['build-image-index'],
              },
              {
                name: 'clair-scan',
                taskRef: {
                  name: 'clair-task',
                },
                runAfter: ['build-image-index'],
              },
              {
                name: 'sast-coverity-check',
                taskRef: {
                  name: 'coverity-task',
                },
                runAfter: ['coverity-availability-check'],
              },
              {
                name: 'coverity-availability-check',
                taskRef: {
                  name: 'availability-check-task',
                },
                runAfter: ['build-image-index'],
              },
            ],
          },
        },
        status: {
          pipelineSpec: {
            tasks: [
              {
                name: 'init',
                taskRef: {
                  name: 'init-task',
                },
              },
              {
                name: 'clone-repository',
                taskRef: {
                  name: 'git-clone-task',
                },
                runAfter: ['init'],
              },
              {
                name: 'prefetch-dependencies',
                taskRef: {
                  name: 'prefetch-task',
                },
                runAfter: ['clone-repository'],
              },
              {
                name: 'build-images',
                taskRef: {
                  name: 'buildah-task',
                },
                runAfter: ['prefetch-dependencies'],
                matrix: {
                  params: [
                    {
                      name: 'PLATFORM',
                      value: ['linux/x86_64', 'linux/arm64'],
                    },
                  ],
                },
              },
              {
                name: 'build-image-index',
                taskRef: {
                  name: 'build-index-task',
                },
                runAfter: ['build-images'],
              },
              {
                name: 'deprecated-base-image-check',
                taskRef: {
                  name: 'deprecated-check-task',
                },
                runAfter: ['build-image-index'],
              },
              {
                name: 'clair-scan',
                taskRef: {
                  name: 'clair-task',
                },
                runAfter: ['build-image-index'],
              },
              {
                name: 'sast-coverity-check',
                taskRef: {
                  name: 'coverity-task',
                },
                runAfter: ['coverity-availability-check'],
              },
              {
                name: 'coverity-availability-check',
                taskRef: {
                  name: 'availability-check-task',
                },
                runAfter: ['build-image-index'],
              },
            ],
          },
        },
      };

      // Mock task runs for all tasks
      const taskRuns: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-init',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'init',
            },
          },
          spec: { taskRef: { name: 'init-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-clone-repository',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'clone-repository',
            },
          },
          spec: { taskRef: { name: 'git-clone-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-prefetch-dependencies',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'prefetch-dependencies',
            },
          },
          spec: { taskRef: { name: 'prefetch-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-images-0',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-images',
            },
          },
          spec: { taskRef: { name: 'buildah-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-images-1',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-images',
            },
          },
          spec: { taskRef: { name: 'buildah-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-build-image-index',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'build-image-index',
            },
          },
          spec: { taskRef: { name: 'build-index-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-deprecated-base-image-check',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'deprecated-base-image-check',
            },
          },
          spec: { taskRef: { name: 'deprecated-check-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-clair-scan',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'clair-scan',
            },
          },
          spec: { taskRef: { name: 'clair-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-coverity-availability-check',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'coverity-availability-check',
            },
          },
          spec: { taskRef: { name: 'availability-check-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'test-pipeline-run-sast-coverity-check',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineRun': 'test-pipeline-run',
              'tekton.dev/pipelineTask': 'sast-coverity-check',
            },
          },
          spec: { taskRef: { name: 'coverity-task' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }] },
        },
      ];

      const result = getPipelineRunDataModel(pipelineRun, taskRuns);

      expect(result).toBeTruthy();
      expect(result.nodes).toHaveLength(10); // All tasks including matrix instances

      // Find specific nodes
      const init = result.nodes.find((node) => node.id === 'init');
      const cloneRepo = result.nodes.find((node) => node.id === 'clone-repository');
      const prefetch = result.nodes.find((node) => node.id === 'prefetch-dependencies');
      const buildImages0 = result.nodes.find((node) => node.id === 'build-images  (linux/x86_64)');
      const buildImages1 = result.nodes.find((node) => node.id === 'build-images  (linux/arm64)');
      const buildImageIndex = result.nodes.find((node) => node.id === 'build-image-index');
      const deprecatedCheck = result.nodes.find((node) => node.id === 'deprecated-base-image-check');
      const clairScan = result.nodes.find((node) => node.id === 'clair-scan');
      const coverityAvailability = result.nodes.find((node) => node.id === 'coverity-availability-check');
      const sastCoverity = result.nodes.find((node) => node.id === 'sast-coverity-check');

      // Test correct dependencies
      expect(cloneRepo.runAfterTasks).toContain('init');
      expect(prefetch.runAfterTasks).toContain('clone-repository');
      expect(buildImages0.runAfterTasks).toContain('prefetch-dependencies');
      expect(buildImages1.runAfterTasks).toContain('prefetch-dependencies');
      expect(buildImageIndex.runAfterTasks).toContain('build-images  (linux/x86_64)');
      expect(buildImageIndex.runAfterTasks).toContain('build-images  (linux/arm64)');
      expect(deprecatedCheck.runAfterTasks).toContain('build-image-index');
      expect(clairScan.runAfterTasks).toContain('build-image-index');
      expect(coverityAvailability.runAfterTasks).toContain('build-image-index');
      expect(sastCoverity.runAfterTasks).toContain('coverity-availability-check');

      // Test that erroneous dependencies are NOT present
      // init should NOT be connected to build-images
      expect(init.runAfterTasks).not.toContain('build-images  (linux/x86_64)');
      expect(init.runAfterTasks).not.toContain('build-images  (linux/arm64)');
      
      // clone-repository should NOT be connected to build-images
      expect(cloneRepo.runAfterTasks).not.toContain('build-images  (linux/x86_64)');
      expect(cloneRepo.runAfterTasks).not.toContain('build-images  (linux/arm64)');
      
      // init should NOT be connected to build-image-index
      expect(init.runAfterTasks).not.toContain('build-image-index');
      
      // clone-repository should NOT be connected to sast-coverity-check
      expect(cloneRepo.runAfterTasks).not.toContain('sast-coverity-check');
    });
  });
}); 