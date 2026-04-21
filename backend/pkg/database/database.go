package database

import (
	"errors"
	"fmt"
	"permen_api/config"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB        *gorm.DB
	DbManager *DatabaseManager
)

type DatabaseManager struct {
	Databases map[string]*gorm.DB
}

func New() *DatabaseManager {
	return &DatabaseManager{
		Databases: make(map[string]*gorm.DB),
	}
}

func (dm *DatabaseManager) Register(instanceName string, dbConf *config.DatabaseConfig) error {
	gormLogger := logger.Default.LogMode(logger.Info)
	if config.ENV.ReleaseMode == "prod" {
		gormLogger = logger.Default.LogMode(logger.Silent)
	}

	dbDriver := mysql.Open(fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8&parseTime=True&loc=Local", dbConf.User, dbConf.Password, dbConf.Host, dbConf.Port, dbConf.Database))

	db, err := gorm.Open(dbDriver, &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return err
	}

	if dbConf.MaxIdleConns != 0 {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}

		sqlDB.SetMaxIdleConns(dbConf.MaxIdleConns)
		sqlDB.SetMaxOpenConns(dbConf.MaxOpenConns)
		sqlDB.SetConnMaxLifetime(time.Duration(dbConf.ConnMaxLifeTime) * time.Second)
		sqlDB.SetConnMaxIdleTime(time.Duration(dbConf.ConnMaxIdleTime) * time.Second)
	}

	dm.Databases[instanceName] = db

	return nil
}

func (dm *DatabaseManager) GetDatabase(instanceName string) *gorm.DB {
	if _, ok := dm.Databases[instanceName]; !ok {
		return nil
	}

	sqlDB, err := dm.Databases[instanceName].DB()
	if err != nil {
		return nil
	}

	if err := sqlDB.Ping(); err != nil {
		return nil
	}

	return dm.Databases[instanceName]
}

func (dm *DatabaseManager) Close(instanceName string) error {
	if _, ok := dm.Databases[instanceName]; !ok {
		return errors.New("database not registered")
	}

	sqlDB, err := dm.Databases[instanceName].DB()
	if err != nil {
		return err
	}

	err = sqlDB.Close()
	if err != nil {
		return err
	}

	delete(dm.Databases, instanceName)
	return nil
}
