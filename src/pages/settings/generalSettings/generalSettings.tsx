import { DownloadOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Button, Upload } from 'antd'
import React from 'react'
import Swal from 'sweetalert2'

const GeneralSettings: React.FC = () => {
	
	const handleExport = (): void => {
		chrome.storage.local.get(null, (data: any) => {
			const jsonData = JSON.stringify(data, null, 2);
			const blob = new Blob([jsonData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			const now = new Date();
			const day = now.getDate();
			const month = now.getMonth() + 1;
			const hour = now.getHours();
			const minute = now.getMinutes();
			link.href = url;
			link.download = `autoapply_settings_${day}_${month}_[${hour}_${minute}].json`;
			link.click();
			URL.revokeObjectURL(url);
		});
	};
	
	const uploadProps: UploadProps = {
		name: 'file',
		accept: 'application/json',
		showUploadList: false,
		beforeUpload: (file) => {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				try {
					if (e.target && typeof e.target.result === 'string') {
						const importedData = JSON.parse(e.target.result);
						chrome.storage.local.set(importedData, () => {
							Swal.fire({
								icon: 'success',
								title: 'Import Successful',
								text: 'Settings imported successfully!'
							}).then(() => {
								window.location.reload();
							})
						})
					} else {
						void Swal.fire({
							icon: 'error',
							title: 'Error',
							text: 'Error reading file.'
						});
					}
				} catch (error) {
					void Swal.fire({
						icon: 'error',
						title: 'Parsing Error',
						text: 'JSON parsing error: ' + error
					});
				}
			};
			reader.readAsText(file);
			return false;
		}
	};
	
	const handleRestore = (): void => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'All settings will be deleted. This cannot be undone.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, restore settings!',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				chrome.storage.local.clear(() => {
					Swal.fire({
						icon: 'success',
						title: 'Restored',
						text: 'All settings have been deleted!',
					}).then(() => {
						window.location.reload();
					})
				});
			}
		});
	};
	
	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4">GeneralSettings</h2>
			<div className="mb-4">
				<Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
					Export
				</Button>
				<Upload {...uploadProps}>
					<Button className="ml-2" icon={<UploadOutlined />}>
						Import
					</Button>
				</Upload>
				<Button danger className="ml-2" icon={<ReloadOutlined />} onClick={handleRestore}>
					Restore
				</Button>
			</div>
		</div>
	);
};

export default GeneralSettings;
