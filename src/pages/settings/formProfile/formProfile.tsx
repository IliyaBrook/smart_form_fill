import { UploadOutlined } from '@ant-design/icons'
import DefaultProfileTooltip from '@pages/settings/formProfile/defaultProfileTooltip'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import findAndGroupDuplicates from '@src/utils/findAndGroupDuplicates'
import findKeysByValue from '@src/utils/findKeyByValue'
import { Button, Input, message, Select, Table, Upload, type UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

const FormProfile = () => {
	const { profiles, profileNames, activeProfile } = useStorage(formProfileStorage);
	const [newProfileName, setNewProfileName] = useState<string>('');
	const isDefaultProfile = activeProfile === 'default';
	const [isReady, setIsReady] = useState(false);
	console.log("profiles: ", profiles)
	
	useEffect(() => {
		setTimeout(() => {
			setIsReady(true);
		}, 1000)
	}, [])
	
	const currentProfile = profiles[activeProfile] ?? {};
	
	
	const handleProfileChange = (value: string) => {
		formProfileStorage.set(prev => ({
			...prev,
			activeProfile: value,
		}));
	};
	
	const handleAddValue = async () => {
		setIsReady(false);
		formProfileStorage.get()
			.then(currentData => {
				formProfileStorage.set({
					...currentData,
					profiles: {
						...currentData.profiles,
						[currentData.activeProfile]: {
							...currentData.profiles[currentData.activeProfile],
							[`newKey_${Date.now()}`]: { name: '', value: '', type: 'text' },
						},
					},
				})
			})
	};
	
	const handleDeleteRow = (key: string) => {
		formProfileStorage.set(prev => {
			const newProfile = { ...prev.profiles[prev.activeProfile] };
			delete newProfile[key];
			return {
				...prev,
				profiles: {
					...prev.profiles,
					[prev.activeProfile]: newProfile,
				},
			};
		});
	};
	
	const handleDuplicateProfile = () => {
		const newName = `${activeProfile} (copy)`;
		if (profileNames.includes(newName)) {
			Swal.fire({
				icon: 'warning',
				title: 'Duplicate Profile Name',
				text: 'A profile with this name already exists. Please choose a different name.',
			});
			return;
		}
		
		formProfileStorage.set(prev => ({
			...prev,
			profileNames: [...prev.profileNames, newName],
			profiles: {
				...prev.profiles,
				[newName]: { ...prev.profiles[prev.activeProfile] },
			},
			activeProfile: newName,
		}));
	};
	
	const handleDeleteProfile = () => {
		if (activeProfile === 'default') return;
		
		formProfileStorage.set(prev => {
			const newProfiles = { ...prev.profiles };
			delete newProfiles[prev.activeProfile];
			return {
				...prev,
				profileNames: prev.profileNames.filter(name => name !== prev.activeProfile),
				profiles: newProfiles,
				activeProfile: 'default',
			};
		});
	};
	
	const handleRenameProfile = () => {
		if (!newProfileName) return;
		if (profileNames.includes(newProfileName)) {
			Swal.fire({
				icon: 'warning',
				title: 'Duplicate Profile Name',
				text: 'A profile with this name already exists. Please choose a different name.',
			});
			return;
		}
		
		formProfileStorage.set(prev => {
			const newProfiles = { ...prev.profiles, [newProfileName]: prev.profiles[prev.activeProfile] };
			delete newProfiles[prev.activeProfile];
			return {
				...prev,
				profiles: newProfiles,
				profileNames: prev.profileNames.map(name => name === prev.activeProfile ? newProfileName : name),
				activeProfile: newProfileName,
			};
		});
		setNewProfileName('');
	};
	
	const handleCreateProfile = () => {
		if (!newProfileName) return;
		if (profileNames.includes(newProfileName)) {
			Swal.fire({
				icon: 'warning',
				title: 'Duplicate Profile Name',
				text: 'A profile with this name already exists. Please choose a different name.',
			});
			return;
		}
		
		formProfileStorage.set(prev => ({
			...prev,
			profileNames: [...prev.profileNames, newProfileName],
			profiles: {
				...prev.profiles,
				[newProfileName]: {},
			},
			activeProfile: newProfileName,
		}));
		setNewProfileName('');
	};
	const handleProfileItemChange = (
		key: string,
		field: 'name' | 'value' | 'type',
		value: string
	) => {
		formProfileStorage.set((prev) => {
			const profile = prev.profiles[prev.activeProfile];

			if (field === 'name') {
				const updatedItem = { ...profile[key], name: value };
				const { [key]: removed, ...rest } = profile;
				return {
					...prev,
					profiles: {
						...prev.profiles,
						[prev.activeProfile]: {
							...rest,
							[value]: updatedItem,
						},
					},
				};
			}

			return {
				...prev,
				profiles: {
					...prev.profiles,
					[prev.activeProfile]: {
						...profile,
						[key]: {
							...profile[key],
							[field]: value,
						},
					},
				},
			};
		});
	};
	
	const handleFileUpload = (info: any, key: string) => {
		if (info.file.status === 'done') {
			const reader = new FileReader();
			reader.onload = (e: any) => {
				console.log("handleFileUpload result:", e.target.result.split(',')[1])
				formProfileStorage.set((prev) => ({
					...prev,
					profiles: {
						...prev.profiles,
						[prev.activeProfile]: {
							...prev.profiles[prev.activeProfile],
							[key]: {
								...prev.profiles[prev.activeProfile][key],
								value: {
									name: info.file.name,
									content: e.target.result.split(',')[1],
								},
								type: 'file',
							},
						},
					},
				}));
				message.success(`${info.file.name} file uploaded successfully`);
			};
			reader.readAsDataURL(info.file.originFileObj);
		} else if (info.file.status === 'error') {
			message.error(`${info.file.name} file upload failed.`);
		}
	};
	
	const onRuleNameCheckDuplicates = (event: React.FocusEvent, record: any) => {
		const newName = (event.target as HTMLInputElement).value;
		const duplicateKey = Object.keys(currentProfile).find(
			(key) => key !== record.key && currentProfile[key].name === newName
		);
		if (duplicateKey) {
			Swal.fire({
				icon: 'warning',
				title: 'Duplicate Rule Name',
				text:
					'A rule with this name already exists in the current profile. Please choose a different name.',
			}).then(() => {
				formProfileStorage.set((prev) => {
					const updatedProfile = { ...prev.profiles[prev.activeProfile] };
					delete updatedProfile[record.key];
					return {
						...prev,
						profiles: {
							...prev.profiles,
							[prev.activeProfile]: updatedProfile,
						},
					};
				});
			});
		}
	};
	
	const columns: ColumnsType<any> = [
		{
			title: 'Rule Name',
			dataIndex: 'name',
			key: 'name',
			render: (_, record) => (
				<Input
					defaultValue={record.name}
					// onChange={(e) => handleProfileItemChange(record.key, 'name', e.target.value)}
					onBlur={(event) => {
						handleProfileItemChange(record.key, 'name', event.target.value)
						onRuleNameCheckDuplicates(event, record)
					}}
				/>
			),
		},
		{
			title: 'Rule Type',
			dataIndex: 'type',
			key: 'type',
			render: (_, record) => (
				<Select
					value={record.type}
					onChange={(value) => handleProfileItemChange(record.key, 'type', value)}
					options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]}
				/>
			),
		},
		{
			title: 'Rule Value',
			dataIndex: 'value',
			key: 'value',
			render: (_, record) => {
				if (record.type === 'text') {
					return (
						<Input
							value={typeof record.value === 'string' ? record.value : ''}
							onChange={(e) => handleProfileItemChange(record.key, 'value', e.target.value)}
						/>
					);
				} else if (record.type === 'file') {
					const uploadProps: UploadProps = {
						name: 'file',
						showUploadList: false,
						onChange: (info) => handleFileUpload(info, record.key),
					};
					return (
						<div>
							<Upload {...uploadProps}>
								<Button icon={<UploadOutlined />}>Upload File</Button>
							</Upload>
							{record.value && typeof record.value === 'object' && record.value.name && (
								<span className="ml-2">{record.value.name}</span>
							)}
						</div>
					);
				}
				return null;
			},
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<DefaultProfileTooltip isDefaultProfile={isDefaultProfile}>
					<Button size="small" onClick={() => handleDeleteRow(record.key)} disabled={isDefaultProfile}>
						x
					</Button>
				</DefaultProfileTooltip>
			),
		},
	];
	
	const tableData = Object.keys(currentProfile).map((key) => ({
		key,
		name: currentProfile[key].name,
		type: currentProfile[key].type,
		value: currentProfile[key].value,
	}));
	
	useEffect(() => {
		if (!isReady) return;
		if (Object.keys(currentProfile).length !== 0) {
			const emptyFields = findKeysByValue(currentProfile, '');
			if (emptyFields.length > 0) {
				formProfileStorage.set((prev) => {
					const updatedProfiles = { ...prev.profiles };
					emptyFields.forEach((key) => {
						delete updatedProfiles[prev.activeProfile][key];
					});
					return {
						...prev,
						profiles: {
							...updatedProfiles,
						},
					};
				});
			}
			const { uniqueObject, duplicateKeys } = findAndGroupDuplicates(currentProfile, (item) => item.name);
			if (duplicateKeys.length > 0) {
				formProfileStorage.set(prev => ({
					...prev,
					profiles: {
						...prev.profiles,
						[prev.activeProfile]: uniqueObject
					}
				}))
			}
		}
	}, [currentProfile, profiles, activeProfile, isReady]);
	
	return (
		<div>
			<div className="grid grid-cols-[8fr_1fr_1fr_1fr_1fr_2fr] gap-1">
				<div className="flex items-center justify-center mb-[16px]">
					<span className="mr-2">Profile</span>
					<Select
						style={{ width: '100%' }}
						value={activeProfile}
						onChange={handleProfileChange}
						options={profileNames.map(name => ({ value: name, label: name }))}
					/>
				</div>
				<div>
					<Button className="w-full" onClick={handleDuplicateProfile}>
						Duplicate
					</Button>
				</div>
				<div>
					<DefaultProfileTooltip isDefaultProfile={isDefaultProfile}>
						<Button className='w-full' onClick={handleDeleteProfile} disabled={isDefaultProfile}>
							Delete
						</Button>
					</DefaultProfileTooltip>
				</div>
				<div>
					<DefaultProfileTooltip isDefaultProfile={isDefaultProfile}>
						<Button className='w-full' onClick={handleRenameProfile} disabled={isDefaultProfile}>
							Rename
						</Button>
					</DefaultProfileTooltip>
				</div>
				<div>
					<Button className="w-full" onClick={handleCreateProfile}>
						Create
					</Button>
				</div>
				<div>
					<Input placeholder="New Profile Name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
				</div>
			</div>
			<div>
				<Table
					columns={columns}
					dataSource={tableData}
					pagination={false}
				/>
				<DefaultProfileTooltip isDefaultProfile={isDefaultProfile}>
					<Button onClick={handleAddValue} disabled={isDefaultProfile}>Add a new Value</Button>
				</DefaultProfileTooltip>
			</div>
		</div>
	);
};
export default FormProfile;