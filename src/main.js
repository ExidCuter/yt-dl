const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const ytSearch = require('youtube-search');

const fs = require('fs');
const youtubedl = require('youtube-dl');
let ffmpeg = require('ffmpeg');

let win;

let opts = {
    maxResults: 10,
    key: 'YT-API-KEY'
};

function createWindow() {
    win = new BrowserWindow({ width: 1380, height: 860 });

    win.Menu = {};

    win.loadFile('src/index.html');

    win.on('closed', () => {
        win = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

ipcMain.on('search:query', (e, query) => {
    ytSearch(query, opts, function (err, results) {
        if (err) return console.log(err);

        win.webContents.send("result:video", results);
    });
});

ipcMain.on('video:down', (e, vid) => {
    let url = "http://www.youtube.com/watch?v=" + vid.id;
    var video = youtubedl(url, ['--format=mp4'], { cwd: __dirname });

    switch (vid.format) {
        case "1":
            video = youtubedl(url, ['--format=mp4'], { cwd: __dirname });
            video.pipe(fs.createWriteStream("downloads/" + vid.title + '.mp4'));
            break;
        case "2":
            youtubedl.exec(url, ['-x', '--audio-format', 'mp3', '-o', 'downloads/' + vid.title + '.mp3"'], {}, function exec(err, output) {
                'use strict';
                if (err) { throw err; }
                win.webContents.send("download:finish", vid.id);
            });
            break;
        case "3":
            youtubedl(url, ['--format=webm'], { cwd: __dirname });
            video.pipe(fs.createWriteStream("downloads/" + vid.title + '.webm'));
            break;
    }

    win.webContents.send("download:start", vid.id);

    video.on('end', function () {
        win.webContents.send("download:finish", vid.id);
    });
});

ipcMain.on('video:open', (e, folder) => {
    shell.openItem('downloads/');
});


