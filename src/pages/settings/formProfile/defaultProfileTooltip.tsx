import { Tooltip } from 'antd'
import React from 'react'

interface IDefaultProfileTooltip {
	isDefaultProfile: boolean;
	children: React.ReactNode;
}

const DefaultProfileTooltip:React.FC<IDefaultProfileTooltip> = ({isDefaultProfile, children}) => {
	if (isDefaultProfile) {
		return (
			<Tooltip title="Create a new profile or duplicate this default profile to make changes" color="red">
				{children}
			</Tooltip>
		)
	}
	return <>{children}</>
}

export default DefaultProfileTooltip;