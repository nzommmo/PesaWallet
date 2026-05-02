import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { G, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';
import axiosInstance from '../../../axiosinstance';

interface Transaction {
  id: number;
  user: string;
  type: 'PAYMENT' | 'TRANSFER' | 'INCOME' | string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  created_at: string;
}

type FilterType = 'ALL' | 'PAYMENT' | 'TRANSFER' | 'INCOME' | 'FAILED';

const FILTERS: FilterType[] = ['ALL', 'PAYMENT', 'TRANSFER', 'INCOME', 'FAILED'];

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; chart: string }> = {
  PAYMENT:  { icon: '💳', color: 'text-blue-600',   bg: 'bg-blue-50',   chart: '#3b82f6' },
  TRANSFER: { icon: '↔️', color: 'text-purple-600', bg: 'bg-purple-50', chart: '#a855f7' },
  INCOME:   { icon: '📈', color: 'text-green-600',  bg: 'bg-green-50',  chart: '#22c55e' },
  DEFAULT:  { icon: '💸', color: 'text-gray-600',   bg: 'bg-gray-50',   chart: '#6b7280' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  SUCCESS: { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  FAILED:  { color: 'text-red-700',   bg: 'bg-red-100',   dot: 'bg-red-500'   },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
const SvgBarChart = ({ data }: { data: { date: string; volume: number }[] }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth  = screenWidth - 64;
  const chartHeight = 160;
  const paddingLeft = 36;
  const paddingBottom = 24;
  const innerW = chartWidth - paddingLeft;
  const innerH = chartHeight - paddingBottom;

  const maxVolume = Math.max(...data.map((d) => d.volume), 1);
  const gap       = innerW / data.length;
  const barWidth  = Math.max(8, gap * 0.5);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((pct) => {
        const val = maxVolume * pct;
        const y   = innerH - pct * innerH;
        return (
          <SvgText key={pct} x={paddingLeft - 4} y={y + 4} fontSize={9} fill="#9ca3af" textAnchor="end">
            {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
          </SvgText>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.volume / maxVolume) * innerH);
        const x    = paddingLeft + i * gap + gap / 2 - barWidth / 2;
        const y    = innerH - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barWidth} height={barH} fill="#1f2937" rx={4} ry={4} />
            <SvgText x={x + barWidth / 2} y={chartHeight - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
              {d.date}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
const SvgDonutChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const size   = 200;
  const cx     = size / 2;
  const cy     = size / 2;
  const outerR = 80;
  const innerR = 55;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const polarToCartesian = (r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const arcPath = (sa: number, ea: number) => {
    const s1 = polarToCartesian(outerR, sa);
    const e1 = polarToCartesian(outerR, ea);
    const s2 = polarToCartesian(innerR, ea);
    const e2 = polarToCartesian(innerR, sa);
    const large = ea - sa > Math.PI ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ');
  };

  let startAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI * 0.98; // 0.98 for small gap
    const slice = { ...d, startAngle, endAngle: startAngle + angle };
    startAngle += (d.value / total) * 2 * Math.PI;
    return slice;
  });

  return (
    <View>
      <Svg width={size} height={size} style={{ alignSelf: 'center' }}>
        {slices.map((s, i) => (
          <Path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} />
        ))}
      </Svg>
      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
            <Text style={{ fontSize: 12, color: '#374151' }}>{d.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  useEffect(() => { fetchTransactions(activeFilter); }, [activeFilter]);

  const fetchTransactions = async (filter: FilterType) => {
    try {
      const url =
        filter === 'ALL'
          ? '/internal/transactions/'
          : `/internal/transactions/?type=${filter}`;
      const response = await axiosInstance.get(url);
      setTransactions(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchTransactions(activeFilter); };

  const summary = useMemo(() => ({
    total:   transactions.length,
    success: transactions.filter((t) => t.status === 'SUCCESS').length,
    pending: transactions.filter((t) => t.status === 'PENDING').length,
    failed:  transactions.filter((t) => t.status === 'FAILED').length,
    volume:  transactions.filter((t) => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0),
  }), [transactions]);

  const volumeByDate = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.status === 'SUCCESS')
      .forEach((t) => {
        const key = formatShortDate(t.created_at);
        map[key] = (map[key] || 0) + t.amount;
      });
    return Object.entries(map).map(([date, volume]) => ({ date, volume })).slice(-10);
  }, [transactions]);

  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => { map[t.type] = (map[t.type] || 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({
      name: type,
      value: count,
      color: TYPE_CONFIG[type]?.chart ?? TYPE_CONFIG.DEFAULT.chart,
    }));
  }, [transactions]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    transactions.forEach((t) => {
      if (!map[t.type]) map[t.type] = { count: 0, volume: 0 };
      map[t.type].count  += 1;
      map[t.type].volume += t.amount;
    });
    return Object.entries(map).map(([type, stats]) => ({ type, ...stats }));
  }, [transactions]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="bg-gray-900 rounded-b-3xl pb-8">
          <View className="px-6 pt-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center gap-2 mb-6 self-start bg-white/10 px-4 py-2 rounded-full"
            >
              <Text className="text-white text-sm font-medium">← Back</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-white text-2xl font-bold">Transactions</Text>
                <Text className="text-gray-400 text-sm mt-1">{summary.total} total records</Text>
              </View>
              <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center">
                <Text className="text-3xl">💸</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Success</Text>
                <Text className="text-green-400 font-bold text-lg">{summary.success}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Pending</Text>
                <Text className="text-yellow-400 font-bold text-lg">{summary.pending}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Failed</Text>
                <Text className="text-red-400 font-bold text-lg">{summary.failed}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total Volume */}
        <View className="mx-6 mt-4 bg-gray-900 rounded-2xl p-4 flex-row items-center justify-between">
          <Text className="text-gray-400 text-sm">Success Volume</Text>
          <Text className="text-white font-bold text-lg">KES {summary.volume.toLocaleString()}</Text>
        </View>

        {/* Bar Chart */}
        {!loading && volumeByDate.length > 0 && (
          <View className="mx-6 mt-4 bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-gray-900 font-bold text-sm mb-4">Volume Over Time (KES)</Text>
            <SvgBarChart data={volumeByDate} />
          </View>
        )}

        {/* Donut + Category Cards */}
        {!loading && typeBreakdown.length > 0 && (
          <View className="mx-6 mt-4 gap-4">
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <Text className="text-gray-900 font-bold text-sm mb-2">By Transaction Type</Text>
              <SvgDonutChart data={typeBreakdown} />
            </View>

            <View>
              <Text className="text-gray-900 font-bold text-sm mb-3">Category Breakdown</Text>
              <View className="gap-3">
                {categoryStats.map(({ type, count, volume }) => {
                  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.DEFAULT;
                  return (
                    <View key={type} className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-4">
                      <View className={`w-12 h-12 ${cfg.bg} rounded-xl items-center justify-center`}>
                        <Text className="text-2xl">{cfg.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-sm ${cfg.color}`}>{type}</Text>
                        <Text className="text-gray-400 text-xs">{count} transaction{count !== 1 ? 's' : ''}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 font-bold text-sm">KES {volume.toLocaleString()}</Text>
                        <Text className="text-gray-400 text-xs">
                          {summary.total > 0 ? Math.round((count / summary.total) * 100) : 0}% of total
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs + Refresh */}
        <View className="px-6 mt-6 flex-row items-center justify-between gap-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row gap-2 pb-1">
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => { setLoading(true); setActiveFilter(filter); }}
                  className={`px-4 py-2 rounded-full border ${
                    activeFilter === filter ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${activeFilter === filter ? 'text-white' : 'text-gray-600'}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={handleRefresh} className="flex-shrink-0 p-1">
            <Text className={`text-xl ${refreshing ? 'opacity-40' : 'text-gray-500'}`}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        <View className="px-6 mt-4 mb-10">
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#1f2937" />
              <Text className="text-gray-500 mt-3">Loading transactions...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-gray-500 font-medium">No transactions found</Text>
              <Text className="text-gray-400 text-sm mt-1">Try a different filter</Text>
            </View>
          ) : (
            <View className="gap-3">
              {transactions.map((tx) => {
                const typeConfig   = TYPE_CONFIG[tx.type]     ?? TYPE_CONFIG.DEFAULT;
                const statusConfig = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <View key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className={`w-11 h-11 ${typeConfig.bg} rounded-xl items-center justify-center`}>
                        <Text className="text-xl">{typeConfig.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>{tx.user}</Text>
                        <Text className={`text-xs font-medium ${typeConfig.color}`}>{tx.type}</Text>
                      </View>
                      <Text className="text-gray-900 font-bold text-base">
                        KES {tx.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg}`}>
                        <View className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <Text className={`text-xs font-semibold ${statusConfig.color}`}>{tx.status}</Text>
                      </View>
                      <Text className="text-gray-400 text-xs">{formatDate(tx.created_at)}</Text>
                      <Text className="text-gray-300 text-xs">#{tx.id}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}