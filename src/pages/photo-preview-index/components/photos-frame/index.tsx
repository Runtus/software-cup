import { Album as IAlbum, requestAlbum } from '@/axios/album';
import { Music, requestMusicList } from '@/axios/music';
import { deletePhoto, Photo as IPhoto, requestAllPhotos, requestBySearchPhoto, requestPhotos, requestWonderful } from '@/axios/photo';
import { Album } from '@/components/album';
import { HighQualityPhoto } from '@/components/high-quality-photo';
import { Photo } from '@/components/photo';
import { searchValue } from '@/recoils/searchState';
import { NotFound } from '@/svgs/notFound';
import { LeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import { Alert, Button, Checkbox, Input, message, Modal, Pagination, Select, Spin, Upload } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import axios from 'axios'
import "./index.css";
import { StyleAllContent, StyleBody, StyleHeader, StyleNotFound, StylePhotoCheck } from './style';

type Props = {};

const { Option } = Select;

const PREVIEW_MAP: {
  [key: string]: string;
} = {
  'all-photo': '全部照片',
  recent: '最近图片',
  "0": '事物',
  "1": '风景',
  "2": '人像',
};

const TOAST_LOADING_KEY = 1
const TOAST_SUCCESS_KEY = 2
const TEST_ACCOUNT = '2018091609025'

export const PhotoFrame: React.FC<Props> = (props) => {
  const params: {current: string} = useParams();
  const urlObj = useLocation();
  const history = useHistory()

  const isAlbum = !urlObj.search


  const [vis, setVis] = useState(false)
  const [deleteVis, setDeleteVis] = useState(false)

  const [choosedId, setChoosedId] = useState('')
  
  const [totalPgaes, setTotalPages] = useState(1)
  const [current, setCurrent] = useState(1)
  const [isEdit, setIsEdit] = useState(false)

  const [wonderfulIds, setWonderfulIds] = useState<Array<string>>([])

  const [videoDialog, setVideoDialog] = useState(false)

  const [wondefulUrl, setwondefulUrl] = useState("")

  const [downloadLoading, setDownloadLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false)



  const [albums, setAlbums] = useState<Array<IAlbum>>([])
  const [photos, setPhotos] = useState<Array<IPhoto>>([])
  const [musics, setMusics] = useState<Array<Music>>([])

  // 精彩剪辑标题
  const [videoTitle, setVideoTitle] = useState('')
  const [music, setMusic] = useState('')

  /* 
    判断生成视频弹窗目前是编辑态还是生成态。 
    true -> 编辑态
    false -> 生成态
    第一次进入都是编辑态
  */
  const [videoIsEdit, setVideoIsEdit] = useState(true)

  const {run : onMusicTitleChange} = useDebounceFn((title: string) => {
    setVideoTitle(title)
  }, {
    wait: 100
  })

  const [refreshToken, setRefreshToken] = useState(1)

  // top-bar search value
  const [search] = useRecoilState(searchValue)

  // keyword search photo
  const requestBySearch = useCallback((searchValue: string) => {
    setImagesLoading(true)
    requestBySearchPhoto(searchValue, current, 10, TEST_ACCOUNT)
      .then(res => {
        if(res){
          setPhotos(res.imgList)
          setTotalPages(res.total)
        } else {
          // no search result
          setPhotos([])
          setTotalPages(1)
          setCurrent(1)
        }
        setTimeout(() => {
          setImagesLoading(false)
        })
      })
      .catch(err => {
        console.error('搜索接口异常，请联系管理员')
      })
  }, [current])

  // Albums-request
  const requestAlbumLocal = useCallback(() => {
    setImagesLoading(true)
    const currentParam = params ? params.current : '0'
    // hard code
    requestAlbum('2018091609025',currentParam , true)
      .then(res => {
        setAlbums(res)
        // hard code -> Album paging max : 1
        setTotalPages(1)
        setCurrent(1)
        setImagesLoading(false)
      })
      .catch(err => {
        console.error(err)
      })
  },[params])


  // 请求音乐 
  const requestMusicLocal = useCallback(() => {
    requestMusicList()
    .then(res => {
      setMusics(res)
    })
    .catch(err => {
      console.error('出现错误，请联系管理员')
    })
  }, [])

// photos-request
  const requestPhotosLocal = useCallback(() => {
    setImagesLoading(true)
    const key = urlObj.search.split('=')[1]
    requestPhotos(TEST_ACCOUNT, key, current, 10)
      .then(res => {
        setTotalPages(res.total)
        setPhotos(res.imgList)
        setImagesLoading(false)
      })
      .catch(err => {
        console.error(err)
      })
  },[current, urlObj.search])

  // all-photo request
  const requestPhotoAllLocal = useCallback((pageNum: number ,isRecent ?: boolean) => {
    setImagesLoading(true)
    requestAllPhotos(TEST_ACCOUNT, current, pageNum)
    .then(res => {
      if (isRecent){
        // 最近上传只展示一页
        setTotalPages(1)
      } else {
        setTotalPages(res.total)
      }
      setPhotos(res.imgList)
      setImagesLoading(false)
    })
    .catch(err => {
      console.error(err)
    })
  },[current])
  

  // 精彩剪辑生成
  const local_requestWonderful = useCallback(() => {
    setDownloadLoading(true)
    requestWonderful(wonderfulIds, videoTitle, music)
    .then(res => {
      setwondefulUrl(res.url + '')
      setTimeout(() => {
        setDownloadLoading(false)
      }, 1000)
    })
    .catch(err => {
      console.error(err)
    })
  },[music, videoTitle, wonderfulIds])

  // delete photo
  const deletePhotoLocal = useCallback((fileId: string, imgUrl ?: string) => {
    setConfirmDeleteLoading(true)
    deletePhoto(fileId, imgUrl)
    .then(res => {
      message.success('成功删除',1)
      setConfirmDeleteLoading(false)
      setVis(false)
      setDeleteVis(false)
      setRefreshToken((pre) => pre + 1)
    })
    .catch(err => {
      message.warning("删除失败，请联系管理员", 1)
      setConfirmDeleteLoading(false)
    })
  }, [])

  // @ts-ignore
  const title = params ? PREVIEW_MAP[params.current] : '';
  const directDisplayPhoto = params.current === 'recent' || params.current === 'all-photo'

  useEffect(() => {
    if(search){
      requestBySearch(search)
    }
    else if(title === '全部照片'){
      // 为了演示布局，暂时调整为12个
      requestPhotoAllLocal(12, false)
    }
    else if (title === '最近图片'){
      // 同理如上
      requestPhotoAllLocal(12, true)
    }
    else if(isAlbum){
      requestAlbumLocal()
    } else {
      requestPhotosLocal()
    }
  }, [isAlbum, requestAlbumLocal, requestPhotoAllLocal, requestPhotosLocal, title, refreshToken, search, requestBySearch])

  const uploadingDuration = {
    hideDuration: () => {},
    begin: function(){
      this.hideDuration = message.loading({content: '正在上传中', key: TOAST_LOADING_KEY, duration: 0})
    }
  }

  useEffect(() => {
    requestMusicLocal()
  }, [requestMusicLocal])


  return title ? (
    <StyleAllContent>
      <StyleHeader>
        <span className={"backTitle"}>
          {
            !isAlbum &&
            (
              <Button
                icon={<LeftOutlined />}
                onClick={() => {history.go(-1)}}
                type='link'
              />
           )
          }
          {title} {!isAlbum && ` - ${urlObj.search.split('=')[1]}`}
        </span>
        <div className="btnBox">
          {
          !isEdit ?
          (<>
            <Upload
              className="upload"
              multiple
              onChange={(event) => {
                // 这个地方上传完毕
                if(event.file.status === 'done' || event.file.status === 'error'){
                  const hasOver = (() => event.fileList.every(item => item.status === 'done' || item.status === 'error' || item.status === 'success'))()
                  if (hasOver) {
                    setRefreshToken(pre => pre + 1);
                    uploadingDuration.hideDuration()
                    message.success({
                      content: '上传成功',
                      key: TOAST_SUCCESS_KEY
                    })
                  }
                }

              }}
              data = {{userId:"2018091609025"}}
              action = "http://36.133.57.158:8081/oss/postfile"
              showUploadList={false}
              maxCount = {15}
              beforeUpload={() => {
                uploadingDuration.begin()
              }}
              progress={{showInfo: true, strokeWidth: 20}}
              // action -> 上传地址
            >
              <Button icon={<UploadOutlined />}>
                上传图片
              </Button>
            </Upload>
            <Button
              className="buildNewCut"
              onClick={() => {setDownloadLoading(true);setIsEdit(true)}}
            >
              生成精彩剪辑
            </Button>
          </>)
          :
          (
            <>
              <Button className="build" type="primary" onClick={() => {setVideoDialog(true);}}>
                生成
              </Button>
              <Button className="cancel" onClick={() => {setIsEdit(false); setWonderfulIds([])}}>
                取消
              </Button>
            </>
          )
        }
        </div>

      </StyleHeader>

      <StyleBody>
        {
          imagesLoading ? <div className="loading"><Spin size="large" /></div> :((isAlbum && !directDisplayPhoto) ? 
            albums.map(item => (
              <Album
                id={item.title}
                title={item.title}
                url={item.imgUrl}
                number={item.number}
              />
            ))
          :
          (photos.length !== 0 ? photos.map(item => (
            <StylePhotoCheck key={item.fileId}>
              <Photo
                id={item.fileId}
                url={item.imgUrl}
                desc={item.fileName}
                onIdChange={(id) => {setChoosedId(id)}}
                onVisChange={(vis) => {setVis(vis)}}
              />
              {
                isEdit && 
                (
                  <Checkbox
                    disabled={!isEdit}
                    id={item.imgUrl}
                    defaultChecked={(() => {
                      if(wonderfulIds.find(itemLocal => itemLocal === item.imgUrl)){
                        return true
                      } else {
                        return false
                      }
                    })()}
                    onChange={(e) => {
                      if(e.target.checked) {
                        setWonderfulIds((pre) => {
                          const arr = [...pre]
                          arr.push(e.target.id as unknown as string)
                          return arr
                        })
                      } else {
                        setWonderfulIds((pre) => {
                          const newArray = pre.filter(item => {
                            if(item === e.target.id) {
                              return false
                            } else {
                              return true
                            }
                          })
                          return newArray
                        })
                      }
                    }}
                  >选择</Checkbox>
                )
              }
            </StylePhotoCheck>)

          )
          :
          <StyleNotFound>
            <NotFound className={'notFound'} />
            <p>没找到对应图片</p>
          </StyleNotFound>
        )
        )
        }
      </StyleBody>
      <Pagination
        className="pagin"
        current={current}
        onChange={(page) => setCurrent(page)}
        total={totalPgaes * 10}
        showSizeChanger={false}
      />
      {/* the modal about video */}
      <Modal
        centered
        destroyOnClose={true}
        closable={false}
        width={900}
        visible={videoDialog}
        onCancel={() => {setVideoDialog(false);setwondefulUrl("")}}
        title={videoIsEdit ? '生成视频': videoTitle}
        wrapClassName="videoBox"
        okButtonProps={{
          onClick: () => {
            // 编辑态
            if(videoIsEdit){
              // 生成视频请求
              local_requestWonderful();
              // 转为生成态
              setVideoIsEdit(false)
            } else {
                axios.get(wondefulUrl, {responseType: "blob"})
                  .then(res => {
                    const export_blob = new Blob([res.data])
                    const urlObject = window.URL || window.webkitURL || window;
                    const a = document.createElement('a')
                    a.href = urlObject.createObjectURL(export_blob)
                    a.download = `${videoTitle}.mp4`;
                    a.click()
                    setTimeout(() => {
                      a.remove()
                      setVideoDialog(false)
                      setVideoIsEdit(true)
                    })
                    message.loading('正在下载',0.3)
                  })
            }
          }
        }}
        okText={videoIsEdit ? '确认' : '下载'}
        cancelText="取消"
        afterClose={() => {
          setVideoIsEdit(true)
          setVideoDialog(false)
        }}
        
      >
        {videoIsEdit ? 
          (<div className="video-attr">
            <div className="title-set">
              <span className="sub-title">标题</span>
              <Input placeholder="请输入精彩剪辑标题" onChange={(e) => {onMusicTitleChange(e.target.value)}} />
            </div>
            <div className="music-set">
              <span className="sub-title">背景音乐</span>
              <Select onChange={(e) => setMusic(e as string)} value={music} className="select">
                {
                  musics.map(item => (
                    <Option value={item.id}>
                      {item.title}
                    </Option>
                  ))
                }
              </Select>
            </div>
          </div>)
          :
          (
            downloadLoading ?
            <Spin />
            :
            <div className="video-box">
              <video 
                controls
              >
                <source src={wondefulUrl} type={'video/mp4'}></source>
              </video>
            </div>
          )
        }
        </Modal>
        {/* the modal about high quality image */}
        <Modal
        visible={vis}
        onCancel={() => {setVis(false)}}
        onOk={() => {setVis(false)}}
        centered
        cancelText="删除"
        cancelButtonProps={{
          onClick: () => {setDeleteVis(true) }
        }}
        title="详细"
        okText="关闭"
      >
        <HighQualityPhoto
          id={choosedId}
          key={choosedId}
        />
      </Modal>
      {/* the modal about images-delete confirm */}
      <Modal
        visible={deleteVis}
        centered
        closable={false}
        title="提示"
        okText="删除"
        okButtonProps={{
          onClick: () => {
            let imgUrl = photos.filter(item => item.fileId === choosedId)[0].imgUrl
            deletePhotoLocal(choosedId, imgUrl);
          },
          loading: confirmDeleteLoading
        }}
        cancelText="取消"
        cancelButtonProps={{
          onClick: () => {
            setDeleteVis(false)
          }
        }}
      >
        <Alert
          message="Warning"
          description="照片删除后不可恢复，确定要删除吗？"
          showIcon
          type="warning"
        />
      </Modal>
    </StyleAllContent>
  ) : (
    <span>404 not found</span>
  );
};
