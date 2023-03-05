import fs from 'node:fs'

import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'

export const minify = async (fileMetas, cb) => {
    for (let fileMeta of fileMetas) {
        const fileBuffer = fs.readFileSync(fileMeta.path)
        const result = await imagemin.buffer(fileBuffer, {
            plugins: [
                imageminPngquant({
                    quality: [0.7, 0.9],
                    speed: 1,
                    strip: true
                })
            ]
        })

       cb(result, fileMeta.originalname)
    }
}