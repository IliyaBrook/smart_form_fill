import { cn } from '@utils'
import { Input } from 'antd'
import type { TextAreaProps } from 'antd/lib/input/TextArea'
import React, { useLayoutEffect, useRef } from 'react'

const { TextArea:AntTextArea } = Input;

const TextArea: React.FC<TextAreaProps> = (props) => {
	const textareaRef = useRef(null);
	
	const adjustTextAreaHeight = () => {
		const textAreaElement = (textareaRef.current as unknown as { resizableTextArea?: { textArea: HTMLTextAreaElement } })?.resizableTextArea?.textArea;
		textAreaElement.style.height = "inherit";
		textAreaElement.style.height = `${textAreaElement.scrollHeight}px`;
	};
	
	useLayoutEffect(adjustTextAreaHeight, []);
	
	return (
		<AntTextArea
			ref={textareaRef}
			className={cn('w-full p-2 border-none rounded-md resize-none focus:outline-none focus:ring-2 overflow-hidden', props?.className)}
			onInput={adjustTextAreaHeight}
			{...props}
			onChange={event => {
				adjustTextAreaHeight()
				props?.onChange?.(event)
			}}
			onBlur={event => {
				adjustTextAreaHeight()
				props?.onBlur?.(event)
			}}
		/>
	);
};

export default TextArea;