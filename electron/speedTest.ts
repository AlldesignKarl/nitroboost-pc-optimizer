// @ts-expect-error - fast-speedtest-api no trae tipados
import FastSpeedtest from 'fast-speedtest-api';
import { SpeedTestResult } from './shared/types';

export async function runSpeedTest(): Promise<SpeedTestResult> {
  const speedtest = new FastSpeedtest({
    token: '25b1b1517f76d8a1d0e1b0eb51e9527dd858b19c00e9d61857ad6f5c1adb5ba',
    verbose: false,
    timeout: 15000,
    https: true,
    urlCount: 5,
    bufferSize: 8,
    unit: FastSpeedtest.UNITS.Mbps
  });

  const downloadMbps = await speedtest.getSpeed();
  return {
    downloadMbps: Math.round(downloadMbps * 10) / 10,
    timestamp: Date.now()
  };
}
