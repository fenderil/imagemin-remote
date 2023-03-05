import fs from 'node:fs'

import resizePngBuffer from 'resize-png-buffer'

const parseResizeConfig = (value) =>
    value.split('\n').reduce((memo, row) => {
        row = row.trim()
        
        if (row) {
            memo.push(row.split(' ').map((str) => str.trim()).slice(0, 2))
        }
        
        return memo
    }, [])

const resizePromise = (resizeCurrentFile, [size, suffix], fileMeta) => new Promise((resolve, reject) => {
    resizeCurrentFile([parseFloat(size), parseFloat(size)], (err, buffer) => {
        if (err) {
            return reject(err)
        }

        const nextName = fileMeta.originalname.replace('.png', `${suffix}.png`)
        const nextPath = fileMeta.path.replace(fileMeta.filename, nextName)

        fs.writeFileSync(nextPath, buffer)

        const nextMeta = {
            ...fileMeta,
            filename: nextName,
            originalname: nextName,
            path: nextPath
        }

        return resolve(nextMeta)
    })
})

export const resize = async (resizeConfig, fileMetas, cb) => {
    const resizedFileMetas = []
    const sizes = parseResizeConfig(resizeConfig)

    if (sizes.length) {
        for (let fileMeta of fileMetas) {
            const resizeCurrentFile = resizePngBuffer(fs.readFileSync(fileMeta.path))

            for (let size of sizes) {
                const resizedFileMeta = await resizePromise(resizeCurrentFile, size, fileMeta)
                resizedFileMetas.push(resizedFileMeta)
                cb(resizedFileMetas)
            }
        }

        return resizedFileMetas
    }
    cb(fileMetas)

    return fileMetas
}