package main

import (
	"encoding/csv"
	"fmt"
	"os"
	"strings"
)

func main() {
	// 读取 region.csv
	region1Map := make(map[string]string) // city_name -> city_code
	file1, err := os.Open("region.csv")
	if err != nil {
		fmt.Println("Error opening region.csv:", err)
		return
	}
	defer file1.Close()

	reader1 := csv.NewReader(file1)
	records1, err := reader1.ReadAll()
	if err != nil {
		fmt.Println("Error reading region.csv:", err)
		return
	}

	if len(records1) <= 1 {
		fmt.Println("No data in region.csv")
		return
	}

	for _, record := range records1[1:] {
		if len(record) >= 3 && record[2] != "" {
			cityName := strings.TrimSpace(record[1])
			cityCode := strings.TrimSpace(record[2])
			if cityName != "" {
				if strings.HasSuffix(cityName, "市") {
					cityName = strings.TrimSuffix(cityName, "市")
				}
				region1Map[cityName] = cityCode
			}
		}
	}

	// 读取 region2.csv
	region2Map := make(map[string]string) // city -> city_code
	file2, err := os.Open("region2.csv")
	if err != nil {
		fmt.Println("Error opening region2.csv:", err)
		return
	}
	defer file2.Close()

	reader2 := csv.NewReader(file2)
	records2, err := reader2.ReadAll()
	if err != nil {
		fmt.Println("Error reading region2.csv:", err)
		return
	}

	if len(records2) <= 1 {
		fmt.Println("No data in region2.csv")
		return
	}

	for _, record := range records2[1:] {
		if len(record) >= 2 {
			city := strings.TrimSpace(record[0])
			cityCode := strings.TrimSpace(record[1])
			region2Map[city] = cityCode

		}
	}

	// 比较差异
	fmt.Println("城市代码不一致的记录：")
	fmt.Println("城市名称\tregion.csv代码\tregion2.csv代码")
	fmt.Println("----------------------------------------")

	// 检查 region2Map 中的记录
	for city, code2 := range region2Map {
		if code1, exists := region1Map[city]; exists {
			// 避免重复输出
			if code1 != code2 {
				fmt.Printf(`UPDATE phone_location SET city_code = "%s" WHERE city = "%s"
`,
					code1, city)
			}
		}
	}
}
