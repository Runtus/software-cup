import { DashBoard } from '@/components/dashboard';
import { Sidebar } from '@/components/sidebar';
import React, { useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import { PhotoFrame } from './components/photos-frame';
import './index.css';
import { StyleBody, StyleHeader } from './style';

type Props = {};

const PREVIEW_MAP: {
  [key: string]: string;
} = {
  'all-photo': '全部照片',
  recent: '最近图片',
  album: '相册',
  people: '人物',
  placement: '地点',
  things: '事件',
};

export const PhotoPreview: React.FC<Props> = (props) => {
  const [displayKey, setDisplayKey] = useState('allPhoto');
  const history = useHistory();

  return (
    <div>
      <StyleHeader>
        <DashBoard />
      </StyleHeader>
      <StyleBody>
        <Sidebar
          onChoose={(e) => {
            setDisplayKey(e);
            history.push(`/index/${e}`);
          }}
        />
        <Switch>
          <Route path={['/index/:current']} exact>
            <PhotoFrame />
          </Route>
        </Switch>
      </StyleBody>
    </div>
  );
};
