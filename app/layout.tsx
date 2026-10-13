import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = { title: 'NEXUS · QA 리허설', description: '박성준 — 행사 운영 장애 시나리오 및 상태 화면 테스트' };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
