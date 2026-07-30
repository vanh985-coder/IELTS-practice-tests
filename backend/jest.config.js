module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^prisma/(.*)$': '<rootDir>/prisma/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};