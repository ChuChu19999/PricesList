import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, message, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import './App.css';
import Page404 from '../pages/ErrorPages/Page404/Page404';
import PricesPage from '../pages/PricesPage/PricesPage';
import { BASE_PATH } from '../shared/config/process';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

const appTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#c084fc',
    colorLink: '#c084fc',
    colorBgBase: '#15161a',
    colorBgContainer: '#1e2026',
    colorBorder: '#2d3139',
    colorText: '#e8eaef',
    colorTextSecondary: '#8b919d',
    colorSuccess: '#4ade80',
    colorError: '#f87171',
    colorWarning: '#fbbf24',
    colorInfo: '#c084fc',
    borderRadius: 8,
    fontFamily: 'Tahoma, Geneva, Verdana, sans-serif',
  },
  components: {
    Message: {
      contentBg: '#1e2026',
      colorText: '#e8eaef',
      colorWarning: '#fbbf24',
      colorError: '#f87171',
      colorSuccess: '#4ade80',
      colorInfo: '#c084fc',
    },
  },
};

export default function App() {
  const messageConfigRef = useRef(false);

  useEffect(() => {
    if (messageConfigRef.current) return;
    messageConfigRef.current = true;
    message.destroy();
    document.querySelectorAll('.ant-message').forEach(container => container.remove());
    message.config({
      top: 20,
      duration: 3,
      maxCount: 3,
      rtl: false,
      getContainer: () => document.body,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ruRU} theme={appTheme}>
        <AntApp>
          <BrowserRouter basename={BASE_PATH}>
            <Routes>
              <Route index element={<PricesPage />} />
              <Route path="*" element={<Page404 />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
