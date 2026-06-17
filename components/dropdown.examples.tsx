'use client';

import {useState} from 'react';
import {Dropdown} from './dropdown';
import {Globe} from 'lucide-react';

/**
 * 基础语言下拉组件示例，使用icon固定显示Globe图标
 */
export function LocaleSwitcherExample() {
  const [locale, setLocale] = useState('zh');

  return (
    <Dropdown
      value={locale}
      onChange={setLocale}
      options={[
        {value: 'zh', label: '中文'},
        {value: 'en', label: 'English'},
        {value: 'ja', label: '日本語'},
      ]}
      label="Select Language"
      variant="compact"
      icon={<Globe size={16} />}
    />
  );
}

/**
 * 带图标的下拉组件示例
 */
export function SelectWithIconExample() {
  const [selected, setSelected] = useState('light');

  return (
    <Dropdown
      value={selected}
      onChange={setSelected}
      options={[
        {value: 'light', label: 'Light', icon: '☀️'},
        {value: 'dark', label: 'Dark', icon: '🌙'},
        {value: 'auto', label: 'Auto', icon: '🔄'},
      ]}
      label="Theme"
      variant="default"
    />
  );
}

/**
 * 固定图标示例，触发器始终显示同一个图标，无下拉箭头
 */
export function IconOnlyExample() {
  const [selected, setSelected] = useState('light');

  return (
    <Dropdown
      value={selected}
      onChange={setSelected}
      options={[
        {value: 'light', label: 'Light Mode'},
        {value: 'dark', label: 'Dark Mode'},
        {value: 'auto', label: 'Auto'},
      ]}
      label="Theme"
      variant="compact"
      icon={<span>🌙</span>}
      showChevron={false}
    />
  );
}

/**
 * 自定义渲染触发器的示例
 */
export function CustomTriggerExample() {
  const [selected, setSelected] = useState('option1');

  return (
    <Dropdown
      value={selected}
      onChange={setSelected}
      options={[
        {value: 'option1', label: 'First Option'},
        {value: 'option2', label: 'Second Option'},
        {value: 'option3', label: 'Third Option'},
      ]}
      label="Custom Trigger"
      variant="default"
      renderTrigger={(selected) => (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Globe size={16} />
          <span>{selected?.label || 'Select'}</span>
        </div>
      )}
    />
  );
}
