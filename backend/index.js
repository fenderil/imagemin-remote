import path from 'node:path'
import fs from 'node:fs'

import express from 'express'
import archiver from 'archiver'
import multer from 'multer'
import { nanoid } from 'nanoid'
import cookieParser from 'cookie-parser'

import { minify } from './minify.js'
import { resize } from './resize.js'

const port = process.env.PORT || 8000
const ids = {}

const multerInOperation = (req, res, next) => {
    const upload = multer({ dest: `/backend/temp/${req.cookies.id}` })
        .array('filesInput')

    upload(req, res, next)
}

express()
    .use(cookieParser())
    .get('/', (req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'static', 'index.html'))
    })
    .get('/id', (req, res) => {
        const id = nanoid()

        res.cookie('id', id)
        res.sendStatus(200)
    })
    .get('/status', (req, res) => {
        if (ids[req.cookies.id]) {
            res.json({
                progress: ids[req.cookies.id]
            })
        } else {
            res.sendStatus(400)
        }
    })
    .post('/minify', multerInOperation, async (req, res) => {
        if (req.files.length) {
            const tempFolder = path.resolve(process.cwd(), 'backend', 'temp')
            const tempIdFolder = path.resolve(tempFolder, req.cookies.id)

            if (!fs.existsSync(tempFolder)) {
                fs.mkdirSync(tempFolder)
            }
            if (!fs.existsSync(tempIdFolder)) {
                fs.mkdirSync(tempIdFolder)
            }

            const archive = archiver('zip', {
                zlib: { level: 9 }
            })
            const zipPath = path.resolve(tempIdFolder, 'output.zip')

            const zipStream = fs.createWriteStream(zipPath)
            zipStream.on('close', () => {
                res.contentType('zip')
                res.send(fs.readFileSync(zipPath))

                fs.rmSync(tempIdFolder, { recursive: true, force: true })
                delete ids[req.cookies.id]
            })

            archive.pipe(zipStream)

            ids[req.cookies.id] = {
                current: 0,
                total: req.files.length
            }

            const resizedFiles = await resize(req.body.resizeTextarea, req.files, (files) => {
                ids[req.cookies.id].total = files.length
            })

            ids[req.cookies.id].total = resizedFiles.length

            await minify(resizedFiles, (result, name) => {
                archive.append(result, { name })
                ids[req.cookies.id].current += 1
            })

            archive.finalize()
        } else {
            res.sendStatus(400)
        }
    })
    // HTML + PWA
    .use('/static', express.static(path.resolve(process.cwd(), 'static')))
    // 404
    .use('*', (req, res) => {
        res.sendStatus(404)
    })
    // Start
    .listen(port, () => {
        console.log(`started on http://localhost:${port || 4242}`)
    })
