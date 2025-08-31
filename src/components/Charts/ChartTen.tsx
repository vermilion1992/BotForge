import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface ChartElevenProps {
  returnRate: number;
}

const ChartTen: React.FC<ChartElevenProps> = ({
  returnRate: returnRateValue,
}) => {
  const series = [
    {
      name: "New Sales",
      data:
        returnRateValue >= 0
          ? [151, 252, 185, 201, 269, 191, 295, 187, 248, 370, 310, 350, 300]
          : [300, 350, 310, 370, 248, 187, 295, 191, 269, 201, 185, 252, 151],
    },
  ];

  const options: ApexOptions = {
    colors: [returnRateValue >= 0 ? "#10B981" : "#FB5454"],
    chart: {
      height: 70,
      type: "area",
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
    },
    grid: {
      show: false,
    },
    fill: {
      gradient: {
        stops: [0, 100],
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 1,
    },
    xaxis: {
      type: "datetime",
      categories: [
        "2018-09-19T00:00:00.000Z",
        "2018-09-19T01:30:00.000Z",
        "2018-09-19T02:30:00.000Z",
        "2018-09-19T03:30:00.000Z",
        "2018-09-19T04:30:00.000Z",
        "2018-09-19T05:30:00.000Z",
        "2018-09-19T06:30:00.000Z",
        "2018-09-19T07:30:00.000Z",
        "2018-09-19T08:30:00.000Z",
        "2018-09-19T09:30:00.000Z",
        "2018-09-19T10:30:00.000Z",
        "2018-09-19T11:30:00.000Z",
        "2018-09-19T12:30:00.000Z",
      ],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
  };

  return (
    <div className="relative h-7.5 w-full max-w-20">
      <div className="chartEleven chartEleven-01 absolute right-0 top-1/2 -translate-y-2/3">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={70}
        />
      </div>
    </div>
  );
};

export default ChartTen;
