import DefaultProfileTooltip from '@pages/settings/formProfile/defaultProfileTooltip'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import rulesStorage from '@src/storage/rulesStorage'
import { Button, Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React from 'react'

const formRules = () => {
	const rulesData = useStorage(rulesStorage)
	const { profiles } = useStorage(formProfileStorage)
	const uniqueKeys = Array.from(
		new Set(
			Object.values(profiles).flatMap((profile) => Object.keys(profile))
		)
	);
	const filteredKeys = uniqueKeys.filter((key) => !rulesData.hasOwnProperty(key));
	const rulesNameOptions = filteredKeys.map((key) => ({
		value: key,
		label: key,
	}))
	
	const tableData = Object.keys(rulesData).map((key) => ({
		key,
		['site-rule']: rulesData[key]['site-rule'],
		['field-rule']: rulesData[key]['field-rule']
	}))
	
	const handleChange = async (
		key: string,
		field: 'field-rule' | 'site-rule' | 'rule-name',
		value: string
	) => {
		const prev = await rulesStorage.get();
		let newRules = { ...prev };
		
		if (field === 'rule-name') {
			if (key === value) return;
			delete newRules[key];
			newRules[value] = prev[key];
		} else if (field === 'field-rule' || field === 'site-rule') {
			if (newRules[key][field] === value) return;
			newRules[key] = { ...newRules[key], [field]: value };
		}
		
		await rulesStorage.set(newRules);
	};

	const handleDeleteRow = (key: string) => {
		rulesStorage.set(prev => {
			const newRules = { ...prev }
			delete newRules[key]
			return newRules
		})
	}
	const handleAddValue = () => {
		rulesStorage.set(prev => {
			console.log('prev: ', prev)
			const newRules = { ...prev }
			newRules[rulesNameOptions[0].value] = {
				'site-rule': '(?:)',
				'field-rule': ''
			}
			return newRules
		})
	}

	const columns: ColumnsType<any> = [
		{
			title: 'Rule Name',
			dataIndex: 'rule-name',
			key: 'rule-name',
			render: (_, record) => (
				<Select
					value={record.key}
					onChange={(value) => {
						handleChange(record.key, 'rule-name', value)
					}}
					options={rulesNameOptions}
				/>
			)
		},
		{
			title: 'Rule Type',
			dataIndex: 'site-rule',
			key: 'site-rule',
			render: (_, record) => (
				<Input
					defaultValue={record['site-rule']}
					onBlur={(event) => {
						handleChange(record.key, 'site-rule', event.target.value)
					}}
				/>
			)
		},
		{
			title: 'Rule value',
			dataIndex: 'field-rule',
			key: 'field-rule',
			render: (_, record) => (
				<Input
					defaultValue={record['field-rule']}
					onBlur={(event) => {
						handleChange(record.key, 'field-rule', event.target.value)
					}}
				/>
			)
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Button size='small' onClick={() => handleDeleteRow(record.key)}>
					x
				</Button>
			)
		}
	]

	return (
		<div>
			<Table
				columns={columns}
				dataSource={tableData}
				pagination={false}
				sortDirections={['ascend']}
			/>
			<div className="flex w-full">
				<Button
					onClick={handleAddValue}
					size='large'
					className="h-[44px] w-[10%]"
				>
					Add a new Value
				</Button>
			</div>
		</div>
	)
}
export default formRules