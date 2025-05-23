package main

import (
	"fmt"
	"os"
	"path"

	"github.com/flywave/jstopo/gen"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v2"
)

var (
	dirPath    string
	threading  string
	configFile string
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

var rootCmd = &cobra.Command{
	Use:     "topo",
	Version: "1.0.0", // 添加版本号
	Short:   "Topo.js 构建工具",
	Long: `Topo.js 构建工具，提供完整的构建流程和子命令支持。
使用 -h 或 --help 查看帮助信息`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if dirPath == "" {
			dirPath, _ = os.Getwd()
		}
	},
}

func init() {
	cobra.OnInitialize(initConfig)

	// 全局参数
	rootCmd.PersistentFlags().StringVarP(&dirPath, "dir", "d", "", "工作目录路径")
	rootCmd.PersistentFlags().StringVarP(&configFile, "config", "c", "gen/topo.full.yml", "配置文件路径")

	rootCmd.PersistentFlags().BoolP("single-threaded", "st", false, "使用单线程模式")
	rootCmd.PersistentFlags().BoolP("multi-threaded", "mt", false, "使用多线程模式")
	rootCmd.PersistentFlags().StringVarP(&threading, "threading", "t", "single-threaded", "线程模式 (single-threaded|multi-threaded)")

	// 添加子命令
	rootCmd.AddCommand(
		newRunBuildCmd(),
		newGenerateCmd(),
		newBuildOggCmd(),
		newBuildBindingsCmd(),
		newBuildTopoBindingsCmd(),
		newBuildTopoCmd(),
		newGenTypescriptDefsCmd(),
		newCleanCmd(),
	)

	rootCmd.SetHelpFunc(func(cmd *cobra.Command, args []string) {
		// 自定义帮助信息
		fmt.Println(cmd.Long)
		fmt.Println("\n使用示例:")
		fmt.Println("  topo run -d ./path -c config.yml -mt")
		fmt.Println("  topo generate -d ./path -st")
		cmd.Usage()
	})
}

func newRunBuildCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "run",
		Short: "运行完整构建流程",
		Run: func(cmd *cobra.Command, args []string) {
			fileName := path.Join(dirPath, configFile)
			if err := gen.RunBuild(dirPath, fileName); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		},
	}
}

func newGenerateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "generate",
		Short: "生成绑定代码",
		Run: func(cmd *cobra.Command, args []string) {
			if err := gen.GenerateCustomCodeBindings(dirPath, ""); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		},
	}
}

func newBuildOggCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "build-ogg",
		Short: "构建OGG源",
		Run: func(cmd *cobra.Command, args []string) {
			argsMap := map[string]string{"threading": threading}
			gen.BuildOggSource(dirPath, argsMap)
		},
	}
}

func newBuildBindingsCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "build-bindings",
		Short: "构建绑定代码",
		Run: func(cmd *cobra.Command, args []string) {
			argsMap := map[string]string{"threading": threading}
			if err := gen.CompileCustomCodeBindings(dirPath, argsMap); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		},
	}
}

func newBuildTopoBindingsCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "build-topo-bindings",
		Short: "构建Topo绑定源",
		Run: func(cmd *cobra.Command, args []string) {
			argsMap := map[string]string{"threading": threading}
			gen.BuildTopoBindingsSource(dirPath, argsMap)
			gen.GenSourceTypescriptDefs(dirPath)
		},
	}
}

func newBuildTopoCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "build-topo",
		Short: "构建Topo源",
		Run: func(cmd *cobra.Command, args []string) {
			argsMap := map[string]string{"threading": threading}
			gen.BuildTopoSource(dirPath, argsMap)
		},
	}
}

func newGenTypescriptDefsCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "gen-ts",
		Short: "生成TypeScript定义",
		Run: func(cmd *cobra.Command, args []string) {
			fileName := path.Join(dirPath, configFile)
			data, err := os.ReadFile(fileName)
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}

			var buildConfig gen.BuildConfig
			if err := yaml.Unmarshal(data, &buildConfig); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}

			typescriptDefinitions, err := gen.CollectTypescriptDefs(buildConfig, dirPath)
			if err != nil {
				fmt.Println(err)
				os.Exit(1)
			}

			if err := gen.GenerateTypescriptDefs(dirPath, typescriptDefinitions, buildConfig.MainBuild.Name); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		},
	}
}

func newCleanBindingsCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "bindings",
		Short: "清理bindings构建目录",
		Run: func(cmd *cobra.Command, args []string) {
			dir := path.Join(dirPath, "build/bindings")
			fmt.Printf("清理目录: %s\n", dir)
			if err := os.RemoveAll(dir); err != nil {
				fmt.Printf("清理失败: %v\n", err)
			}
			fmt.Println("bindings清理完成")
		},
	}
}

func newCleanOcctCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "occt",
		Short: "清理occt构建目录",
		Run: func(cmd *cobra.Command, args []string) {
			dir := path.Join(dirPath, "build/occt")
			fmt.Printf("清理目录: %s\n", dir)
			if err := os.RemoveAll(dir); err != nil {
				fmt.Printf("清理失败: %v\n", err)
			}
			fmt.Println("occt清理完成")
		},
	}
}

func newCleanSrcCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "src",
		Short: "清理src构建目录",
		Run: func(cmd *cobra.Command, args []string) {
			dir := path.Join(dirPath, "build/src")
			fmt.Printf("清理目录: %s\n", dir)
			if err := os.RemoveAll(dir); err != nil {
				fmt.Printf("清理失败: %v\n", err)
			}
			fmt.Println("src清理完成")
		},
	}
}

func newCleanCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "clean",
		Short: "清理构建生成的文件",
		Run: func(cmd *cobra.Command, args []string) {
			// 默认执行全部清理
			newCleanBindingsCmd().Run(cmd, args)
			newCleanOcctCmd().Run(cmd, args)
			newCleanSrcCmd().Run(cmd, args)
		},
	}

	// 添加子命令
	cmd.AddCommand(newCleanBindingsCmd())
	cmd.AddCommand(newCleanOcctCmd())
	cmd.AddCommand(newCleanSrcCmd())

	return cmd
}

func initConfig() {
	viper.AutomaticEnv()
	viper.SetEnvPrefix("topo")

	// 处理线程模式标志
	if viper.GetBool("single-threaded") {
		threading = "single-threaded"
	}
	if viper.GetBool("multi-threaded") {
		threading = "multi-threaded"
	}
}
