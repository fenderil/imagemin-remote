import fs from 'node:fs'

import sharp from 'sharp'

const parseResizeConfig = (value) =>
    value.split('\n').reduce((memo, row) => {
        row = row.trim()
        
        if (row) {
            const [size, suffix = ''] = row.split(' ').map((str) => str.trim())
            memo.push({ size, suffix })
        }
        
        return memo
    }, [])

export const resize = async (resizeConfig, fileMetas, cb) => {
    const resizedFileMetas = []
    const scales = parseResizeConfig(resizeConfig)

    if (scales.length) {
        for (let fileMeta of fileMetas) {
            for (let scale of scales) {
                const buffer = await sharp(fileMeta.path)
                    .resize(parseFloat(scale.size), parseFloat(scale.size))
                    .png()
                    .toBuffer()
                    
                const nextName = fileMeta.originalname.replace('.png', `${scale.suffix}.png`)
                const nextPath = fileMeta.path.replace(fileMeta.filename, nextName)

                fs.writeFileSync(nextPath, buffer)

                const nextMeta = {
                    ...fileMeta,
                    filename: nextName,
                    originalname: nextName,
                    path: nextPath
                }

                resizedFileMetas.push(nextMeta)
                cb(resizedFileMetas)
            }
        }

        return resizedFileMetas
    }
    cb(fileMetas)

    return fileMetas
}