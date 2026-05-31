import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/models/DailyReading.dart';
import '../app_theme.dart';

class TrendsChart extends StatelessWidget {
  final List<DailyReading> readings;
  const TrendsChart({super.key, required this.readings});

  @override
  Widget build(BuildContext context) {
    if (readings.isEmpty) {
      return const Center(
        child: Text(
          'No health readings available.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    // Sort readings by date to ensure the chart is chronological
    final sortedReadings = List<DailyReading>.from(readings)
      ..sort((a, b) => a.date.compareTo(b.date));

    // Take the last 7 readings for the chart
    final recentReadings = sortedReadings.length > 7
        ? sortedReadings.sublist(sortedReadings.length - 7)
        : sortedReadings;

    final systolicSpots = List.generate(
        recentReadings.length,
        (i) => FlSpot(
            i.toDouble(), recentReadings[i].bloodPressure.systolic.toDouble()));
    final diastolicSpots = List.generate(
        recentReadings.length,
        (i) => FlSpot(i.toDouble(),
            recentReadings[i].bloodPressure.diastolic.toDouble()));
    final pulseSpots = List.generate(recentReadings.length,
        (i) => FlSpot(i.toDouble(), recentReadings[i].pulseRate.toDouble()));

    return LineChart(
      LineChartData(
        minY: 60,
        maxY: 135,
        backgroundColor: AppTheme.card,
        gridData: FlGridData(
          show: true,
          horizontalInterval: 10,
          getDrawingHorizontalLine: (v) =>
              FlLine(color: Colors.white12, strokeWidth: 1),
          drawVerticalLine: false,
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              interval: 10,
              getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                  style: const TextStyle(color: Colors.white38, fontSize: 11)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 1,
              getTitlesWidget: (v, _) {
                final index = v.toInt();
                if (index >= 0 && index < recentReadings.length) {
                  final date = recentReadings[index].date;
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(DateFormat('d MMM').format(date),
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 11)),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          _line(systolicSpots, color: const Color(0xFF9D7CFF)), // Systolic
          _line(diastolicSpots, color: const Color(0xFF4FD1C5)), // Diastolic
          _line(pulseSpots, color: const Color(0xFFF0C63C)), // Pulse
        ],
      ),
    );
  }

  LineChartBarData _line(List<FlSpot> spots, {required Color color}) {
    return LineChartBarData(
      isCurved: true,
      color: color,
      barWidth: 3,
      dotData: const FlDotData(show: false),
      spots: spots,
    );
  }
}
