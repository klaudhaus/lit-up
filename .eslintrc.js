module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": [
        "standard"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
      // General preference - prefer double quotes
      "quotes": [2, "double"],

      // lit-up specific cases
      // await functions that may or may not be asynchronous
      "no-return-await": 0,
      // instantiate updates if it is a class constructor
      "new-cap": 0
    }
};