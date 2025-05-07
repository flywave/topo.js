package main

import (
	"fmt"
	"os"

	"github.com/flywave/jstopo/gen"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var rootCmd = &cobra.Command{
	Use:   "generate",
	Short: "Generate bindings for OpenCASCADE",
	Run: func(cmd *cobra.Command, args []string) {
		gen.GenerateCustomCodeBindings("")
	},
}

func init() {
	cobra.OnInitialize(initConfig)
	// 这里可以添加命令行flag
}

func initConfig() {
	viper.AutomaticEnv() // 自动读取环境变量
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
