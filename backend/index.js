import path from 'node:path'
import fs from 'node:fs'

import express from 'express'
import imagemin from 'imagemin'
import imageminOptipng from 'imagemin-optipng'
import archiver from 'archiver'
import multer from 'multer'
import { nanoid } from 'nanoid'

const port = process.env.PORT || 8000

const upload = multer({ dest: '/tmp/' })

express()
    .get('/', (req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'static', 'index.html'))
    })
    .post('/minify', upload.array('filesInput'), async (req, res) => {
        if (req.files.length) {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            })

            const zipPath = path.resolve(process.cwd(), 'tmp', `${nanoid()}.zip`)

            const zipStream = fs.createWriteStream(zipPath)

            zipStream.on('close', () => {
                console.log(archive.pointer() + ' total bytes')
                res.contentType('zip')
                res.send(fs.readFileSync(zipPath))
                fs.unlinkSync(zipPath)
            })

            archive.pipe(zipStream)

            for (let i = 0; i < req.files.length; i += 1) {
                const name = req.files[i].originalname
                const file = fs.readFileSync(req.files[i].path)
                const result = await imagemin.buffer(file, {
                    plugins: [
                        imageminOptipng()
                    ]
                })

                archive.append(result, { name })
            }

            archive.finalize()
        } else {
            res.sendStatus(400)
        }
    })
    .use('/static', express.static(path.resolve(process.cwd(), 'static')))
    .use('*', (req, res) => {
        res.sendStatus(404)
    })
    .listen(port, () => {
        console.log(`started on http://localhost:${port || 4242}`)
    })
