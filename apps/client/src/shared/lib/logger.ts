import { ILogObj, Logger } from 'tslog';

interface LogMetaData extends ILogObj {
  _meta?: {
    runtime: string;
    browser: string;
    date: string;
    logLevelId: number;
    logLevelName: string;
    path: {
      fullFilePath: string;
      fileName: string;
      fileColumn: string;
      fileLine: string;
      filePath: string;
      filePathWithLine: string;
    };
  };
}

const logger = new Logger<LogMetaData>({
  type: 'pretty',
  prefix: ['Kijk'],
});

// logger.attachTransport((logObj) => {
//   const { _meta } = logObj;
//   if (_meta) {
//     if (_meta.logLevelId >= ErrorLevel) {
//       // const newError = new Error(JSON.stringify(logObj));
//       // sentry exception logging
//     } else {
//       // sentry event logging
//     }
//   }
// });

export { logger };
