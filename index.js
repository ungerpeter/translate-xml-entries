const fs = require('fs');
const path = require('path');
const jxon = require('jxon');
const translate = require('google-translate-api');
const argv = require('minimist')(process.argv.slice(2));

const inputFilePath = argv.input || argv._[0];
const outputFilePath = argv.output || argv._[1];
const toLang = argv.to || argv._[2];
const identifier = argv.identifier || argv._[3];

let xmlData = '';
let jsonData = '';
let translationPromises = [];

function mutateValuesAtKey(obj, _key, mutateFunc) {
  for (var key in obj) {
    if (!obj.hasOwnProperty(key))
      continue;
    if (key == _key) {
      let promise = mutateFunc(obj[key]).then(res => {
        obj[key] = res.text;
      }).catch(err => {
        console.log(err);
      });
      translationPromises.push(promise);
    }
    if (typeof obj[key] == "object" && obj[key] !== null) {
      mutateValuesAtKey(obj[key], _key, mutateFunc);
    }
  }
}

function googleTranslationFor(val) {
  return translate(val, {to: toLang});
}

try {
  xmlData = fs.readFileSync(path.resolve(inputFilePath), 'utf8');
  jsonData = jxon.stringToJs(xmlData);

  mutateValuesAtKey(jsonData, identifier, (val) => {
    return googleTranslationFor(val);
  });

  Promise.all(translationPromises).then(translations => {
    fs.writeFile(path.resolve(outputFilePath), jxon.jsToString(jsonData), (err) => {
      if (err) throw err;
      console.log('Translations saved!');
    });
  }).catch(err => {
    console.log("err");
  });
} catch(e) {
  console.log('Error:', e.stack);
}