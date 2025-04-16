import React, { useEffect, useRef, useState } from 'react'
import { useStorage } from '@src/hooks'
import formProfileStorage from '@src/storage/formProfileStorage'
import rulesStorage from '@src/storage/rulesStorage'
import { type RuleItem, typeOption } from '@src/types/settings'
import { Alert, Button, Input, InputRef, notification, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { isValidRegex } from '@utils'

type RuleField = 'field-rule' | 'site-rule' | 'rule-name';

const formRules = () => {
	
	const rulesData = useStorage(rulesStorage)
	const { profiles } = useStorage(formProfileStorage)
	const [rowStatuses, setRowStatuses] = useState<Record<string, Record<string, 'error' | 'warning' | undefined>>>({})
	const [api, contextHolder] = notification.useNotification()
	const [invalidRules, setInvalidRules] = useState<
		{ key: string; msg: string }[]
	>([])
	
	const inputRefs = useRef<
		Record<string, Record<string, React.RefObject<InputRef>>>
	>({})
	
	const openNotification = (message: string, description: string) => {
		api.error({
			message,
			description,
			placement: 'bottomLeft'
		})
	}
	
	const allProfiles = Object.values(profiles).reduce((acc, profile) => {
		return { ...acc, ...profile };
	}, {});
	const uniqueKeys = Array.from(new Set(Object.keys(allProfiles)))
	const filteredKeys = uniqueKeys.filter((key) => !rulesData.hasOwnProperty(key))
	const rulesNameOptions = filteredKeys.map((key) => ({
		value: key,
		label: key
	}))
	
	const tableData = Object.keys(rulesData).map((key) => ({
		key,
		['site-rule']: rulesData[key]['site-rule'],
		['field-rule']: rulesData[key]['field-rule'],
		['rule-name']: key,
		type: allProfiles?.[key]?.['type'] || typeOption.Text
	}))
	
	const handleChange = async (recordKey: string, field: RuleField, value: string) => {
		const prev = await rulesStorage.get()
		let newRules = {
			...prev,
			[recordKey]: {
				...(prev[recordKey] || { 'field-rule': '', 'site-rule': '', 'rule-name': recordKey }),
				type: allProfiles?.[recordKey]?.['type'] || typeOption.Text,
				'rule-name': recordKey
			}
		}
		if (field === 'rule-name') {
			if (recordKey === value) return
			if (newRules[recordKey]) {
				newRules[value] = newRules[recordKey]
				delete newRules[recordKey]
			}
		} else {
			if (!isValidRegex(value)) {
				setRowStatuses((prevState) => ({
					...prevState,
					[recordKey]: { ...prevState[recordKey], [field]: 'error' }
				}))
				openNotification('Invalid RegExp', `"${value}" is not a valid pattern`)
				return
			} else {
				setRowStatuses((prevState) => ({
					...prevState,
					[recordKey]: { ...prevState[recordKey], [field]: undefined }
				}))
			}
			if (newRules[recordKey]) {
				newRules[recordKey] = {
					...newRules[recordKey],
					[field]: value,
				}
			}
		}
		await rulesStorage.set(newRules)
	}
	
	useEffect(() => {
		const bad: { key: string; msg: string }[] = []
		const newRowStatuses: Record<
			string,
			Record<string, 'error' | 'warning' | undefined>
		> = {}
		for (const ruleKey in rulesData) {
			const site = rulesData[ruleKey]['site-rule']
			const field = rulesData[ruleKey]['field-rule']
			newRowStatuses[ruleKey] = {}
			if (!isValidRegex(site)) {
				bad.push({
					key: ruleKey,
					msg: `Rule "<span class='math-inline'>\{ruleKey\}" has invalid site\-rule\: "</span>{site}"`
				})
				newRowStatuses[ruleKey]['site-rule'] = 'error'
			}
			if (!isValidRegex(field)) {
				bad.push({
					key: ruleKey,
					msg: `Rule "<span class='math-inline'>\{ruleKey\}" has invalid field\-rule\: "</span>{field}"`
				})
				newRowStatuses[ruleKey]['field-rule'] = 'error'
			}
		}
		setInvalidRules(bad)
		setRowStatuses(newRowStatuses)
	}, [rulesData])
	
	
	const handleDeleteRow = (key: string) => {
		void rulesStorage.set(prev => {
			const newRules = { ...prev }
			delete newRules[key]
			return newRules
		})
	}
	const handleAddValue = () => {
		if (rulesNameOptions.length === 0) {
			api.info({
				message: 'No more rules to add, add new fields in Form Profile',
				placement: 'bottomLeft'
			})
			return
		}
		void rulesStorage.set(prev => {
			const newRules = { ...prev }
			newRules[rulesNameOptions[0].value] = {
				'site-rule': '(?:)',
				'field-rule': '',
				'rule-name': rulesNameOptions[0].value,
				type: typeOption.Text
			}
			return newRules
		})
	}

	const columns: ColumnsType<Omit<RuleItem, 'type'> & { key: string }> = [
		{
			title: 'Rule Name',
			dataIndex: 'rule-name',
			key: 'rule-name',
			render: (_, record) => (
				<Select
					value={record.key}
					onChange={(value) => {
						
						void handleChange(record.key, 'rule-name', value)
					}}
					options={rulesNameOptions}
				/>
			)
		},
		{
			title: 'Rule Type',
			dataIndex: 'site-rule',
			key: 'site-rule',
			render: (_, record) => {
				if (!inputRefs.current[record.key]) {
					inputRefs.current[record.key] = {}
				}
				if (!inputRefs.current[record.key]['site-rule']) {
					inputRefs.current[record.key]['site-rule'] = React.createRef()
				}
				return (
					<Input
						status={rowStatuses[record.key]?.['site-rule']}
						defaultValue={record['site-rule']}
						onBlur={(event) => {
							void handleChange(record.key, 'site-rule', event.target.value)
						}}
						ref={inputRefs.current[record.key]['site-rule']}
					/>
				)
			}
		},
		{
			title: 'Rule value',
			dataIndex: 'field-rule',
			key: 'field-rule',
			render: (_, record) => {
				if (!inputRefs.current[record.key]) {
					inputRefs.current[record.key] = {}
				}
				if (!inputRefs.current[record.key]['field-rule']) {
					inputRefs.current[record.key]['field-rule'] = React.createRef()
				}
				return (
					<Input
						ref={inputRefs.current[record.key]['field-rule']}
						status={rowStatuses[record.key]?.['field-rule']}
						defaultValue={record['field-rule'] || `(?:${record['rule-name']})`}
						onBlur={(event) => {
							void handleChange(record.key, 'field-rule', event.target.value)
						}}
					/>
				)
			}
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
	
	const handleAlertClick = (key: string, field: string) => {
		inputRefs.current[key][field].current?.input.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		})
	}
	
	return (
		<div>
			{contextHolder}
			<Table
				columns={columns}
				dataSource={tableData}
				pagination={false}
				sortDirections={['ascend']}
			/>
			<div className='mt-[16px]'>
				{invalidRules.map(({ key, msg }, idx) => {
					const field = msg.includes('site-rule') ? 'site-rule' : 'field-rule'
					return (
						<Alert
							key={idx}
							message='Invalid RegExp'
							description={msg}
							type='error'
							onClick={() => handleAlertClick(key, field)}
							className='mb-[8px] cursor-pointer'
						/>
					)
				})}
			</div>
			<div className='flex w-full'>
				<Button
					onClick={handleAddValue}
					size='large'
					className='h-[44px] w-[10%]'
				>
					Add a new Value
				</Button>
			</div>
		</div>
	)
}
export default formRules