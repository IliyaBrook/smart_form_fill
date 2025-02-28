import DefaultProfileTooltip from '@pages/settings/formProfile/defaultProfileTooltip'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import findAndGroupDuplicates from '@src/utils/findAndGroupDuplicates'
import findKeysByValue from '@src/utils/findKeyByValue'
import { Button, Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

const FormProfile = () => {
	const { profiles, profileNames, currentProfileName } = useStorage(formProfileStorage);
	const [newProfileName, setNewProfileName] = useState<string>('');
	const isDefaultProfile = currentProfileName === 'default';
	const [isReady, setIsReady] = useState(false);
	
	useEffect(() => {
		setTimeout(() => {
			setIsReady(true);
		}, 1000)
	}, [])
	
	const currentProfile = profiles[currentProfileName] ?? {};
	
	
	const handleProfileChange = (value: string) => {
		formProfileStorage.set(prev => ({
			...prev,
			currentProfileName: value,
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
						[currentData.currentProfileName]: {
							...currentData.profiles[currentData.currentProfileName],
							[`newKey_${Date.now()}`]: { name: '', value: '' },
						},
					},
				})
			})
	};
	
	const handleDeleteRow = (key: string) => {
		formProfileStorage.set(prev => {
			const newProfile = { ...prev.profiles[prev.currentProfileName] };
			delete newProfile[key];
			return {
				...prev,
				profiles: {
					...prev.profiles,
					[prev.currentProfileName]: newProfile,
				},
			};
		});
	};
	
	const handleDuplicateProfile = () => {
		const newName = `${currentProfileName} (copy)`;
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
				[newName]: { ...prev.profiles[prev.currentProfileName] },
			},
			currentProfileName: newName,
		}));
	};
	
	const handleDeleteProfile = () => {
		if (currentProfileName === 'default') return;
		
		formProfileStorage.set(prev => {
			const newProfiles = { ...prev.profiles };
			delete newProfiles[prev.currentProfileName];
			return {
				...prev,
				profileNames: prev.profileNames.filter(name => name !== prev.currentProfileName),
				profiles: newProfiles,
				currentProfileName: 'default',
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
			const newProfiles = { ...prev.profiles, [newProfileName]: prev.profiles[prev.currentProfileName] };
			delete newProfiles[prev.currentProfileName];
			return {
				...prev,
				profiles: newProfiles,
				profileNames: prev.profileNames.map(name => name === prev.currentProfileName ? newProfileName : name),
				currentProfileName: newProfileName,
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
			currentProfileName: newProfileName,
		}));
		setNewProfileName('');
	};
	const handleProfileItemChange = (key: string, field: 'name' | 'value', value: string) => {
		formProfileStorage.set((prev) => ({
			...prev,
			profiles: {
				...prev.profiles,
				[prev.currentProfileName]: {
					...prev.profiles[prev.currentProfileName],
					[key]: {
						...prev.profiles[prev.currentProfileName][key],
						[field]: value,
					},
				},
			},
		}));
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
					const updatedProfile = { ...prev.profiles[prev.currentProfileName] };
					delete updatedProfile[record.key];
					return {
						...prev,
						profiles: {
							...prev.profiles,
							[prev.currentProfileName]: updatedProfile,
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
					value={record.name}
					onChange={(e) => handleProfileItemChange(record.key, 'name', e.target.value)}
					onBlur={(event) => onRuleNameCheckDuplicates(event, record)}
				/>
			),
		},
		{
			title: 'Rule Value',
			dataIndex: 'value',
			key: 'value',
			render: (_, record) => (
				<Input
					value={record.value}
					onChange={(e) => handleProfileItemChange(record.key, 'value', e.target.value)}
				/>
			),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<DefaultProfileTooltip isDefaultProfile={isDefaultProfile}>
					<Button size='small' onClick={() => handleDeleteRow(record.key)} disabled={isDefaultProfile}>
						x
					</Button>
				</DefaultProfileTooltip>
			),
		},
	];
	
	const tableData = Object.keys(currentProfile).map((key) => ({
		key,
		name: currentProfile[key].name,
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
						delete updatedProfiles[prev.currentProfileName][key];
					});
					return {
						...prev,
						profiles: {
							...updatedProfiles,
						},
					};
				});
			}
			const { uniqueObject, duplicateKeys } = findAndGroupDuplicates(currentProfile);
			if (duplicateKeys.length > 0) {
				formProfileStorage.set(prev => ({
					...prev,
					profiles: {
						...prev.profiles,
						[prev.currentProfileName]: uniqueObject
					}
				}))
			}
		}
	}, [currentProfile, profiles, currentProfileName, isReady]);
	
	return (
		<div>
			<div className="grid grid-cols-[8fr_1fr_1fr_1fr_1fr_2fr] gap-1">
				<div className="flex items-center justify-center mb-[16px]">
					<span className="mr-2">Profile</span>
					<Select
						style={{ width: '100%' }}
						value={currentProfileName}
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
				<Table columns={columns} dataSource={tableData} pagination={false} />
				<Button onClick={handleAddValue}>Add a new Value</Button>
			</div>
		</div>
	);
};
export default FormProfile;