import { IconName } from '../../../../../shared/components/icon/icon';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

export interface ContentSubsection {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
}

export interface ContentStep {
  number: number;
  title: string;
  description: string;
}

export interface ContentCallout {
  type: 'note' | 'tip' | 'warning' | 'info';
  title?: string;
  text: string;
}

export interface ContentTable {
  headers: string[];
  rows: string[][];
}

export interface ContentSection {
  id: string;
  title: string;
  level?: 2 | 3;
  paragraphs?: string[];
  listItems?: string[];
  subsections?: ContentSubsection[];
  steps?: ContentStep[];
  callout?: ContentCallout;
  table?: ContentTable;
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export interface OtherPolicyLink {
  label: string;
  description: string;
  href: string;
  iconName: IconName;
  badge?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isOpen?: boolean;
}

export interface FaqCategory {
  id: string;
  name: string;
  iconName: IconName;
  count?: number;
}
