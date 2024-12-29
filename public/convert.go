package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// 定义嵌套的map结构
type LocationData map[string]map[string][]int

func main() {
	file, err := os.Open("phone_location.csv")
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	// 创建嵌套的map结构
	locationMap := make(LocationData)

	scanner := bufio.NewScanner(file)
	scanner.Scan() // 跳过表头

	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, ",")
		if len(parts) != 2 {
			continue
		}

		phone := parts[0]
		cityCode := parts[1]

		// 获取前三位和后四位
		prefix := phone[:3]
		suffix, _ := strconv.Atoi(phone[3:])

		// 确保城市代码的map存在
		if _, ok := locationMap[cityCode]; !ok {
			locationMap[cityCode] = make(map[string][]int)
		}

		// 确保前缀的数组存在
		if _, ok := locationMap[cityCode][prefix]; !ok {
			locationMap[cityCode][prefix] = make([]int, 0)
		}

		// 添加后四位到对应的数组
		locationMap[cityCode][prefix] = append(locationMap[cityCode][prefix], suffix)
	}

	// 将map转换为JSON
	jsonData, err := json.Marshal(locationMap)
	if err != nil {
		fmt.Println("Error marshaling to JSON:", err)
		return
	}

	// 写入新文件
	err = os.WriteFile("phone_location.json", jsonData, 0644)
	if err != nil {
		fmt.Println("Error writing file:", err)
		return
	}

	fmt.Println("Conversion completed successfully")
}
