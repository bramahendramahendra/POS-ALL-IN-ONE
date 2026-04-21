package logger

import (
	"fmt"
	time_helper "permen_api/helper/time"
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	Log        *Logger
	timeFormat string = "02012006"
)

type Logger struct {
	*zap.Logger
	Mutex *sync.Mutex
	Date  string
}

func New() *Logger {
	currDate := time_helper.GetTimeNow().Format(timeFormat)

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:       "time",
		LevelKey:      "level",
		MessageKey:    "message",
		CallerKey:     "caller",
		NameKey:       "logger",
		StacktraceKey: "",
		// EncodeDuration: zapcore.SecondsDurationEncoder,
		// EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeLevel:  zapcore.CapitalLevelEncoder,
		EncodeTime:   zapcore.ISO8601TimeEncoder,
		EncodeCaller: zapcore.ShortCallerEncoder,
		LineEnding:   zapcore.DefaultLineEnding,
	}

	errorWriter := zapcore.AddSync(&lumberjack.Logger{
		Filename: fmt.Sprintf("./logs/error/error_%s.log", currDate),
		// MaxSize:    20,
		// MaxBackups: 20,
		// MaxAge:     14,
	})
	errorCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		errorWriter,
		zap.LevelEnablerFunc(func(l zapcore.Level) bool {
			return l >= zapcore.ErrorLevel
		}),
	)

	infoWriter := zapcore.AddSync(&lumberjack.Logger{
		Filename: fmt.Sprintf("./logs/app/app_%s.log", currDate),
		// MaxSize:    20,
		// MaxBackups: 20,
		// MaxAge:     14,
	})
	infoCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		infoWriter,
		zap.LevelEnablerFunc(func(l zapcore.Level) bool {
			return l < zapcore.ErrorLevel
		}),
	)

	core := zapcore.NewTee(errorCore, infoCore)

	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	return &Logger{Logger: logger, Mutex: &sync.Mutex{}, Date: currDate}
}

func (l *Logger) Info(message, method, endpoint, context, scope, requestId, startTime, endTime string, data any) {
	l.Mutex.Lock()
	defer l.Mutex.Unlock()

	l.CheckDate()

	l.Logger.Info(message, zap.String("method", method), zap.String("endpoint", endpoint), zap.String("context", context), zap.String("scope", scope), zap.String("requestId", requestId), zap.String("startTime", startTime), zap.String("endTime", endTime), zap.Any("additional_data", data))
}

func (l *Logger) Error(message, context, scope, requestId, stacktrace, startTime, endTime string, data any) {
	l.Mutex.Lock()
	defer l.Mutex.Unlock()

	l.CheckDate()

	l.Logger.Error(message, zap.String("context", context), zap.String("scope", scope), zap.String("requestId", requestId), zap.String("startTime", startTime), zap.String("endTime", endTime), zap.Any("additional_data", data), zap.String("stacktrace", stacktrace))
}

func (l *Logger) Warn(message, method, endpoint, context, scope, requestId, stacktrace, startTime, endTime string, data any) {
	l.Mutex.Lock()
	defer l.Mutex.Unlock()

	l.CheckDate()

	l.Logger.Warn(message, zap.String("method", method), zap.String("endpoint", endpoint), zap.String("context", context), zap.String("scope", scope), zap.String("requestId", requestId), zap.String("startTime", startTime), zap.String("endTime", endTime), zap.Any("additional_data", data), zap.String("stacktrace", stacktrace))
}

func (l *Logger) Debug(message, method, endpoint, context, scope, requestId, startTime, endTime string, data any) {
	l.Mutex.Lock()
	defer l.Mutex.Unlock()

	l.CheckDate()

	l.Logger.Debug(message, zap.String("method", method), zap.String("endpoint", endpoint), zap.String("context", context), zap.String("scope", scope), zap.String("requestId", requestId), zap.String("startTime", startTime), zap.String("endTime", endTime), zap.Any("additional_data", data))
}

func (l *Logger) CheckDate() {
	currDate := time_helper.GetTimeNow().Format(timeFormat)
	if currDate != l.Date {
		newLogger := New()
		l.Logger = newLogger.Logger
		l.Date = newLogger.Date
	}
}
