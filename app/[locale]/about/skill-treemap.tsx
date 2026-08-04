"use client";

import {useEffect, useRef} from "react";
import {useTheme} from "next-themes";
import * as echarts from "echarts";
import styles from "./skill-treemap.module.scss";

type Skill = {
  name: string;
  value: number;
  group: keyof typeof palettes.light;
  icon: string;
};

const skills: Skill[] = [
  {name: "Solidity", value: 120, group: "web3", icon: "icon-solidity"},
  {name: "TypeScript", value: 72, group: "language", icon: "icon-typescript"},
  {name: "React", value: 90, group: "react", icon: "icon-react"},
  {name: "Vue", value: 86, group: "cross", icon: "icon-vue"},
  {name: "AI", value: 85, group: "neutral", icon: "icon-ai"},
  {name: "Next.js", value: 56, group: "react", icon: "icon-next"},
  {name: "Wagmi", value: 42, group: "web3", icon: "icon-wagmi"},
  {name: "Viem", value: 40, group: "web3", icon: "icon-viem"},
  {name: "RainbowKit", value: 64, group: "web3", icon: "icon-rainbowKit"},
  {name: "Tailwind CSS", value: 60, group: "style", icon: "icon-tailwind"},
  {name: "HTML", value: 85, group: "style", icon: "icon-html"},
  {name: "CSS", value: 82, group: "style", icon: "icon-css"},
  {name: "UniApp", value: 48, group: "cross", icon: "icon-uniapp"},
  {name: "Weex", value: 44, group: "cross", icon: "icon-weex"},
  {name: "RN", value: 30, group: "react", icon: "icon-react-native"},
  {name: "Node.js", value: 46, group: "language", icon: "icon-node"},
  {name: "Photoshop", value: 42, group: "design", icon: "icon-ps"},
  {name: "Figma", value: 44, group: "design", icon: "icon-figma"},
];

const palettes = {
  light: {
    web3: {background: "#B8DDD2", foreground: "#18332C"},
    react: {background: "#BED2DF", foreground: "#1D303B"},
    cross: {background: "#BCCFCD", foreground: "#213534"},
    language: {background: "#CEC7DE", foreground: "#302A3D"},
    style: {background: "#DDD3B8", foreground: "#3A3322"},
    design: {background: "#DFC8C8", foreground: "#3B2929"},
    neutral: {background: "#D3D5D6", foreground: "#292C2E"},
  },
  dark: {
    web3: {background: "#294D45", foreground: "#E7F4F0"},
    react: {background: "#2E4654", foreground: "#E7F0F5"},
    cross: {background: "#344A49", foreground: "#E8F1F0"},
    language: {background: "#453D55", foreground: "#F0ECF5"},
    style: {background: "#514934", foreground: "#F5F0E4"},
    design: {background: "#503B3F", foreground: "#F5E9EB"},
    neutral: {background: "#3C3E42", foreground: "#F1F1F2"},
  },
} as const;

type TreemapLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  invisible?: boolean;
};

type TreemapData = {
  count: () => number;
  getName: (index: number) => string;
  getItemLayout: (index: number) => TreemapLayout | undefined;
};

type EChartsModelReader = {
  getModel: () => {
    getSeriesByIndex: (index: number) => {
      getData: () => TreemapData;
    };
  };
};

function getSymbolDataUri(symbolId: string) {
  const symbol = document.getElementById(symbolId);
  if (!(symbol instanceof SVGSymbolElement)) return null;

  const viewBox = symbol.getAttribute("viewBox") ?? "0 0 1024 1024";
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">`,
    symbol.innerHTML,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderSkillIcons(
  chart: echarts.ECharts,
  group: InstanceType<typeof echarts.graphic.Group>,
  isMobile: boolean,
) {
  group.removeAll();

  const chartModel = (chart as unknown as EChartsModelReader).getModel();
  const seriesData = chartModel.getSeriesByIndex(0).getData();
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));

  for (let index = 0; index < seriesData.count(); index += 1) {
    const skill = skillByName.get(seriesData.getName(index));
    const layout = seriesData.getItemLayout(index);

    if (!skill || !layout || layout.invisible) continue;

    const iconUri = getSymbolDataUri(skill.icon);
    if (!iconUri) continue;

    const shortestSide = Math.min(layout.width, layout.height);
    const iconSize = Math.min(
      isMobile ? 24 : 34,
      Math.max(isMobile ? 16 : 20, shortestSide * 0.24),
    );

    group.add(
      new echarts.graphic.Image({
        silent: true,
        z: 10,
        style: {
          image: iconUri,
          x: layout.x + (layout.width - iconSize) / 2,
          y: layout.y + layout.height / 2 - iconSize - (isMobile ? 2 : 4),
          width: iconSize,
          height: iconSize,
        },
      }),
    );
  }
}

type SkillTreemapProps = {
  ariaLabel: string;
  ariaDescription: string;
};

export function SkillTreemap({ariaLabel, ariaDescription}: SkillTreemapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const iconGroupRef = useRef<InstanceType<typeof echarts.graphic.Group> | null>(null);
  const {resolvedTheme} = useTheme();

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let iconGroup: InstanceType<typeof echarts.graphic.Group> | null = null;

    const animationFrameId = requestAnimationFrame(() => {
      const container = chartRef.current;
      if (!container) return;

      const chart = chartInstanceRef.current ?? echarts.init(container);
      chartInstanceRef.current = chart;
      const activeIconGroup = iconGroupRef.current ?? new echarts.graphic.Group({silent: true});
      iconGroup = activeIconGroup;
      iconGroupRef.current = activeIconGroup;

      const mode = resolvedTheme === "dark" ? "dark" : "light";
      const colors = palettes[mode];
      const isMobile = container.clientWidth < 640;

      const data = skills.map((skill) => {
        const color = colors[skill.group];

        return {
          name: skill.name,
          value: skill.value,
          itemStyle: {color: color.background},
          label: {
            color: color.foreground,
            formatter: `\n${skill.name}`,
          },
        };
      });

      const rootStyles = getComputedStyle(document.documentElement);
      const pageBackground = rootStyles.getPropertyValue("--background").trim();
      const textColor = rootStyles.getPropertyValue("--text").trim();
      const fontFamily = rootStyles.getPropertyValue("--font-body").trim();

      const option: echarts.EChartsOption = {
      animationDurationUpdate: 350,
      tooltip: {
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          return `<strong>${item.name}</strong><br/>${item.value}`;
        },
        backgroundColor: mode === "dark" ? "rgba(18, 18, 20, .94)" : "rgba(255, 255, 255, .96)",
        borderColor: rootStyles.getPropertyValue("--border").trim(),
        textStyle: {color: textColor},
        extraCssText: "border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.14);",
      },
      series: [
        {
          type: "treemap",
          width: "100%",
          height: "100%",
          roam: false,
          nodeClick: false,
          breadcrumb: {show: false},
          sort: "desc",
          squareRatio: 1.12,
          visibleMin: 1,
          label: {
            show: true,
            position: "inside",
            align: "center",
            verticalAlign: "middle",
            fontFamily,
            fontSize: isMobile ? 11 : 14,
            fontWeight: 600,
            lineHeight: isMobile ? 29 : 36,
            overflow: "break",
          },
          upperLabel: {show: false},
          itemStyle: {
            borderColor: pageBackground,
            borderWidth: 2,
            gapWidth: 2,
            borderRadius: 6,
          },
          emphasis: {
            focus: "self",
            itemStyle: {
              // shadowBlur: 18,
              // shadowColor: "rgba(0, 0, 0, .18)",
            },
          },
          data,
        },
      ],
      };

      chart.clear();
      chart.setOption(option, {notMerge: true, lazyUpdate: false});
      if (!activeIconGroup.parent) {
        chart.getZr().add(activeIconGroup);
      }
      renderSkillIcons(chart, activeIconGroup, isMobile);

      resizeObserver = new ResizeObserver(() => {
        chart.resize();
        renderSkillIcons(chart, activeIconGroup, container.clientWidth < 640);
      });
      resizeObserver.observe(container);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      iconGroup?.removeAll();
    };
  }, [resolvedTheme]);

  useEffect(() => {
    return () => {
      const iconGroup = iconGroupRef.current;
      if (iconGroup && chartInstanceRef.current) {
        chartInstanceRef.current.getZr().remove(iconGroup);
      }
      iconGroupRef.current = null;
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <section className={styles.panel} aria-label={ariaLabel}>
      <div
        ref={chartRef}
        className={styles.chart}
        role="img"
        aria-label={ariaDescription}
      />
      <ul className="srOnly">
        {skills.map((skill) => (
          <li key={skill.name}>{skill.name}</li>
        ))}
      </ul>
    </section>
  );
}
