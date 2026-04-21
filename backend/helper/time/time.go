package time_helper

import (
	"permen_api/config"
	"strconv"
	"time"
)

func GetTimeNow() time.Time {
	return time.Now().In(config.Location)
}

func GetTimeWithFormat() string {
	return GetTimeNow().Format(config.FormatTime)
}

func GetEndTime(timeString string) string {
	now, err := time.ParseInLocation(config.FormatTime, timeString, config.Location)
	if err != nil {
		panic("failed to parsing time string format, " + err.Error())
	}

	duration := time.Since(now)
	endTime := now.Add(duration)
	return endTime.Format(config.FormatTime)
}

func ConvertToDateFormatString(value time.Time) string {
	return value.Format(config.General.FormatDate)
}

func GenerateMasaPajak() (bulanPajak, tahunPajak string) {
	now := GetTimeNow()
	bulanPajak = now.Format("01")
	tahunPajak = now.Format("2006")
	return
}

// get indonesia day name and today date with format "02 Januari 2006"
func GetIndonesianDayNameAndDate() (dayName, formattedDate string) {
	now := GetTimeNow()
	day := now.Day()
	month := now.Month()
	year := now.Year()
	dayName = getIndonesianDayName(now.Weekday())
	formattedDate = formatIndonesianDate(day, month, year)
	return
}

func getIndonesianDayName(weekday time.Weekday) string {
	dayNames := map[time.Weekday]string{
		time.Sunday:    "Minggu",
		time.Monday:    "Senin",
		time.Tuesday:   "Selasa",
		time.Wednesday: "Rabu",
		time.Thursday:  "Kamis",
		time.Friday:    "Jumat",
		time.Saturday:  "Sabtu",
	}
	return dayNames[weekday]
}

func formatIndonesianDate(day int, month time.Month, year int) string {
	monthNames := map[time.Month]string{
		time.January:   "Januari",
		time.February:  "Februari",
		time.March:     "Maret",
		time.April:     "April",
		time.May:       "Mei",
		time.June:      "Juni",
		time.July:      "Juli",
		time.August:    "Agustus",
		time.September: "September",
		time.October:   "Oktober",
		time.November:  "November",
		time.December:  "Desember",
	}

	monthName := monthNames[month]
	return formatTwoDigits(day) + " " + monthName + " " + formatFourDigits(year)
}

func formatTwoDigits(number int) string {
	if number < 10 {
		return "0" + strconv.Itoa(number)
	}
	return strconv.Itoa(number)
}

func formatFourDigits(number int) string {
	return strconv.Itoa(number)
}
