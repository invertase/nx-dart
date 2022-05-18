module.exports = {
  displayName: 'add-nx-dart-to-monorepo-e2e',
  preset: '../../jest.preset.ts',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/add-nx-dart-to-monorepo-e2e',
  maxWorkers: 1,
};
