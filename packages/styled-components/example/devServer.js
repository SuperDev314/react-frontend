const path = require('path');
const exec = require('child_process').exec;
const Express = require('express');
const watch = require('node-watch');

import fs from 'fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from '..';
import getExample from './example';

const HTML = fs.readFileSync(__dirname + '/index.html').toString();

const srcPath = __dirname.split('/example')[0] + '/src';

const hotBuild = () =>
  exec('npm run build:dist', (err, stdout, stderr) => {
    if (err) throw err;
    if (stdout) {
      console.log(`npm run build:dist --- ${stdout}`);
    }
    if (stderr) {
      console.log(`npm run build:dist --- ${stderr}`);
    }
  });

watch(srcPath, filename => {
  console.log(`${filename} file has changed`);
  hotBuild();
});

const app = new Express();
app.use(Express.static(__dirname));
app.use(Express.static(path.join(__dirname, '../dist')));

app.get('/with-perf.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'with-perf.html'));
});

app.get('/ssr.html', (req, res) => {
  const Example = getExample();

  const sheet = new ServerStyleSheet();
  const html = renderToString(sheet.collectStyles(<Example />));
  const css = sheet.getStyleTags();
  res.send(HTML.replace(/<!-- SSR:HTML -->/, html).replace(/<!-- SSR:CSS -->/, css));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

export default app;
