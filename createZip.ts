import fs from 'fs-extra'
import * as path from 'path'
import archiver from 'archiver'

async function createZipArchive() {
	const distDir = path.resolve('./dist')
	const zipDir = path.resolve('./zip')
	const zipFilePath = path.resolve(zipDir, 'smart_form_fill.zip')
	
	try {
		if (!fs.existsSync(zipDir)) {
			await fs.mkdir(zipDir)
		}
		
		console.log('Creating zip archive...')
		
		const output = fs.createWriteStream(zipFilePath)
		const archive = archiver('zip', {
			zlib: { level: 9 }
		})
		
		output.on('close', () => {
			console.log(`Zip archive created: ${zipFilePath} (${archive.pointer()} bytes)`)
		})
		
		archive.on('error', (err) => {
			throw err
		})
		
		archive.pipe(output)
		
		archive.directory(distDir, false)
		
		await archive.finalize()
		
	} catch (err) {
		console.error('Error creating archive:', err)
	}
}

void createZipArchive()