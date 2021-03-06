import React from 'react'
import { StylePhotoBox } from './style'

type Props = {
    // 根据id去请求高清图
    id: string,
    url: string,
    onIdChange: (id: string) => void,
    onVisChange: (vis: boolean) => void,
    desc ?: string,
}

export const Photo: React.FC<Props> = (props) => {
    const {id, url, onIdChange, onVisChange, desc = '无备注'} = props
    return (
        <StylePhotoBox 
            key={id}
            onClick={() => {
                onIdChange(id)
                // 延迟0.5s，让id先更新
                setTimeout(() => {
                    onVisChange(true)
                })
            }}
        >
            <figure className={'imghvr-push-up imgBox'}>
                <img src={url} alt="图片加载失败，请重试"/>
                <figcaption className="desc">
                    {desc}
                </figcaption>
            </figure>
        </StylePhotoBox>
    )
}