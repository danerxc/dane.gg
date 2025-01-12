import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Select,
    MenuItem, FormControl, InputLabel, Tooltip as MUIToolTip, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    List, ListItem, ListItemText
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import axiosInstance from '../services/axios';
import { getName } from 'country-list';
import * as Flags from 'country-flag-icons/react/3x2';

const defaultStats: Stats = {
    unique_visitors: null,
    total_views: null,
    pages_viewed: null,
    active_days: null,
    popular_pages: [],
    countries: [],
    daily_views: [],
    user_agents: [],
    raw_data: [],
    blog_posts: []
};

interface RawData {
    created_at?: string | null;
    visitor_id?: string | null;
    page_path?: string | null;
    country_code?: string | null;
    user_agent?: string | null;
}

interface CountryData {
    country?: string | null;
    visits?: number | null;
    percentage?: number | null;
}

interface UserAgent {
    user_agent?: string | null;
    count?: number | null;
    percentage?: number | null;
}

interface Stats {
    unique_visitors: number | null;
    total_views: number | null;
    pages_viewed: number | null;
    active_days: number | null;
    popular_pages: Array<{ page_path?: string | null; views?: number | null }> | null;
    countries: CountryData[] | null;
    daily_views: Array<{ date?: string | null; views?: number | null; visitors?: number | null }> | null;
    user_agents: UserAgent[] | null;
    raw_data: RawData[] | null;
    blog_posts: Array<{ page_path?: string | null; views?: number | null }> | null;
}

const OSIcons = {
    Windows: (props: React.SVGProps<SVGSVGElement>) => (
        <svg height="24" width="24" viewBox="0 0 368 408" {...props}>
            <path d="M0 192V80l128-28v138zM363 0v187l-214 3V47zM0 213l128 2v146L0 336V213zm363 6v186l-214-40V215z" fill="currentColor" />
        </svg>
    ),
    Mac: (props: React.SVGProps<SVGSVGElement>) => (
        <svg height="24" width="24" viewBox="0 0 26 26" {...props}>
            <path d="M23.934 18.947c-.598 1.324-.884 1.916-1.652 3.086-1.073 1.634-2.588 3.673-4.461 3.687-1.666.014-2.096-1.087-4.357-1.069-2.261.011-2.732 1.089-4.4 1.072-1.873-.017-3.307-1.854-4.381-3.485-3.003-4.575-3.32-9.937-1.464-12.79C4.532 7.425 6.61 6.237 8.561 6.237c1.987 0 3.236 1.092 4.879 1.092c1.594 0 2.565-1.095 4.863-1.095c1.738 0 3.576.947 4.889 2.581-4.296 2.354-3.598 8.49.742 10.132zM16.559 4.408c.836-1.073 1.47-2.587 1.24-4.131-1.364.093-2.959.964-3.891 2.092-.844 1.027-1.544 2.553-1.271 4.029c1.488.048 3.028-.839 3.922-1.99z" fill="currentColor" />
        </svg>
    ),
    Linux: (props: React.SVGProps<SVGSVGElement>) => (
        <svg height="24" width="24" viewBox="0 0 128 128" {...props}>
            <path d="M113.823 104.595c-1.795-1.478-3.629-2.921-5.308-4.525c-1.87-1.785-3.045-3.944-2.789-6.678c.147-1.573-.216-2.926-2.113-3.452c.446-1.154.864-1.928 1.033-2.753c.188-.92.178-1.887.204-2.834c.264-9.96-3.334-18.691-8.663-26.835c-2.454-3.748-5.017-7.429-7.633-11.066c-4.092-5.688-5.559-12.078-5.633-18.981a47.564 47.564 0 0 0-1.081-9.475C80.527 11.956 77.291 7.233 71.422 4.7c-4.497-1.942-9.152-2.327-13.901-1.084c-6.901 1.805-11.074 6.934-10.996 14.088c.074 6.885.417 13.779.922 20.648c.288 3.893-.312 7.252-2.895 10.34c-2.484 2.969-4.706 6.172-6.858 9.397c-1.229 1.844-2.317 3.853-3.077 5.931c-2.07 5.663-3.973 11.373-7.276 16.5c-1.224 1.9-1.363 4.026-.494 6.199c.225.563.363 1.429.089 1.882c-2.354 3.907-5.011 7.345-10.066 8.095c-3.976.591-4.172 1.314-4.051 5.413c.1 3.337.061 6.705-.28 10.021c-.363 3.555.008 4.521 3.442 5.373c7.924 1.968 15.913 3.647 23.492 6.854c3.227 1.365 6.465.891 9.064-1.763c2.713-2.771 6.141-3.855 9.844-3.859c6.285-.005 12.572.298 18.86.369c1.702.02 2.679.653 3.364 2.199c.84 1.893 2.26 3.284 4.445 3.526c4.193.462 8.013-.16 11.19-3.359c3.918-3.948 8.436-7.066 13.615-9.227c1.482-.619 2.878-1.592 4.103-2.648c2.231-1.922 2.113-3.146-.135-5z" fill="currentColor" />
        </svg>
    ),
    Android: (props: React.SVGProps<SVGSVGElement>) => (
        <svg height="24" width="24" viewBox="0 0 1024 768" {...props}>
            <path d="M896 128q-8 0-18-3L752 252q123 65 197.5 186t74.5 266q0 27-19 45.5T960 768H64q-26 0-45-18.5T0 704q0-145 74.5-266T272 252L146 125q-10 3-18 3q-27 0-45.5-18.5T64 64.5T83 19t45-19t45 19t19 45q0 8-3 18l144 143q88-33 179-33t179 33L835 82q-3-10-3-18q0-26 18.5-45t45-19T941 19t19 45.5t-19 45t-45 18.5zM256 448q-26 0-45 19t-19 45.5t19 45t45 18.5t45-18.5t19-45t-19-45.5t-45-19zm511.5 128q26.5 0 45.5-18.5t19-45t-19-45.5t-45-19t-45 19t-19 45.5t18.5 45t45 18.5z" fill="currentColor" />
        </svg>
    ),
    iOS: (props: React.SVGProps<SVGSVGElement>) => (
        <svg height="24" width="24" viewBox="0 0 24 24" {...props}>
            <path d="M1.1 6.05c-.614 0-1.1.48-1.1 1.08a1.08 1.08 0 0 0 1.1 1.08c.62 0 1.11-.48 1.11-1.08c0-.6-.49-1.08-1.11-1.08m7.61.02c-3.36 0-5.46 2.29-5.46 5.93c0 3.67 2.1 5.95 5.46 5.95c3.34 0 5.45-2.28 5.45-5.95c0-3.64-2.11-5.93-5.45-5.93m10.84 0c-2.5 0-4.28 1.38-4.28 3.43c0 1.63 1.01 2.65 3.13 3.14l1.49.36c1.45.33 2.04.81 2.04 1.64c0 .96-.97 1.64-2.35 1.64c-1.41 0-2.47-.69-2.58-1.75h-2c.08 2.12 1.82 3.42 4.46 3.42c2.79 0 4.54-1.37 4.54-3.55c0-1.71-1-2.68-3.32-3.21l-1.33-.3c-1.41-.34-1.99-.79-1.99-1.55c0-.96.88-1.6 2.18-1.6c1.31 0 2.21.65 2.31 1.72h1.96c-.05-2.02-1.72-3.39-4.26-3.39M8.71 7.82c2.04 0 3.35 1.63 3.35 4.18c0 2.57-1.31 4.2-3.35 4.2c-2.06 0-3.36-1.63-3.36-4.2c0-2.55 1.3-4.18 3.36-4.18M.111 9.31v8.45H2.1V9.31H.11Z" fill="currentColor" />
        </svg>
    )
};

const detectOS = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
};

const processUserAgents = (agents: UserAgent[], totalViews: number): UserAgent[] => {
    return agents.map(agent => ({
        ...agent,
        percentage: Number((((agent.count ?? 0) / totalViews) * 100).toFixed(1))
    }));
};

const getRandomColor = (countryCode: string): string => {
    const hue = (countryCode.charCodeAt(0) * 7 + countryCode.charCodeAt(1) * 11) % 360;
    const saturation = 60 + (countryCode.charCodeAt(1) % 20);
    const lightness = 45 + (countryCode.charCodeAt(0) % 15);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const CountryTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CountryData }[] }) => {
    if (active && payload?.length) {
        const data = payload[0].payload;
        const CountryFlag = data.country ? (Flags as { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> })[data.country] : undefined;
        return (
            <Card sx={{ p: 1, backgroundColor: 'rgba(43, 43, 43, 0.9)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {CountryFlag && <CountryFlag style={{ width: 20 }} />}
                    <Typography>{data.country ? getName(data.country) ?? data.country : 'Unknown'}</Typography>
                    <Typography>{data.visits} visits ({data.percentage}%)</Typography>
                </Box>
            </Card>
        );
    }
    return null;
};

interface PageTooltipPayload {
    payload: {
        page_path?: string;
        views?: number;
    };
}

const PageTooltip = ({ active, payload }: { active?: boolean; payload?: PageTooltipPayload[] }) => {
    if (active && payload?.length) {
        return (
            <Card sx={{ p: 1, backgroundColor: 'rgba(43, 43, 43, 0.9)' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    Page: {payload[0].payload.page_path}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    Views: {payload[0].payload.views}
                </Typography>
            </Card>
        );
    }
    return null;
};

interface TrendTooltipPayload {
    value: number;
    name: string;
}

const TrendTooltip = ({ active, payload, label }: { active?: boolean; payload?: TrendTooltipPayload[]; label?: string }) => {
    if (active && payload?.length) {
        return (
            <Card sx={{ p: 1, backgroundColor: 'rgba(43, 43, 43, 0.9)' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    Date: {label}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    Visitors: {payload[0].value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    Views: {payload[1].value}
                </Typography>
            </Card>
        );
    }
    return null;
};

const processCountryData = (countries: CountryData[]): CountryData[] => {
    const totalVisits = countries.reduce((sum, country) =>
        sum + (country.visits ?? 0), 0);

    return countries.map(country => ({
        country: country.country ?? 'Unknown',
        visits: country.visits ?? 0,
        percentage: Number(((country.visits ?? 0) / (totalVisits ?? 1) * 100).toFixed(1))
    }));
};

const aggregateCountryData = (countries: CountryData[] | null): CountryData[] => {
    if (!countries || countries.length === 0) return [];

    type CountryAccumulator = {
        [key: string]: CountryData
    };

    return Object.values(
        countries.reduce((acc: CountryAccumulator, curr: CountryData) => {
            const countryKey = curr.country ?? 'Unknown';

            if (!acc[countryKey]) {
                acc[countryKey] = {
                    country: countryKey,
                    visits: curr.visits ?? 0,
                    percentage: 0
                };
            } else {
                acc[countryKey].visits = (acc[countryKey].visits ?? 0) + (curr.visits ?? 0);
            }
            return acc;
        }, {} as CountryAccumulator)
    );
};

export const Stats = () => {
    const [stats, setStats] = useState<Stats>(defaultStats);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await axiosInstance.get(`/api/stats?period=${period}`);
            setStats(data);
        };
        fetchStats();
    }, [period]);

    if (!stats) return null;

    const processedCountries = processCountryData(aggregateCountryData(stats.countries));
    const processedAgents = processUserAgents(stats.user_agents ?? [], stats.total_views ?? 0);
    const processedCountriesSorted = [...processedCountries].sort((a, b) => (b.visits ?? 0) - (a.visits ?? 0));


    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h5">Site Statistics</Typography>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="24h">Last 24 Hours</MenuItem>
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="all">All Time</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary">Total Visits</Typography>
                            <Typography variant="h4">{stats.total_views}</Typography>
                        </CardContent>
                    </Card>

                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary">Unique Visitors</Typography>
                            <Typography variant="h4">{stats.unique_visitors}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary">Pages Viewed</Typography>
                            <Typography variant="h4">{stats.pages_viewed}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary">Active Days</Typography>
                            <Typography variant="h4">{stats.active_days}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Visitor Chart */}
                <Grid size={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Visitor Trends</Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats.daily_views ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip content={<TrendTooltip />} />
                                    <Line type="monotone" dataKey="visitors" stroke="#8884d8" />
                                    <Line type="monotone" dataKey="views" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Page Views</Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.popular_pages ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="page_path" />
                                    <YAxis />
                                    <Tooltip content={<PageTooltip />} />
                                    <Bar dataKey="views" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Blog Posts</Typography>
                            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {stats.blog_posts?.map((post) => (
                                    <ListItem key={post.page_path} divider>
                                        <MUIToolTip title={post.page_path}>
                                            <ListItemText
                                                primary={(post.page_path ?? '').replace('/blog/', '')}
                                                sx={{
                                                    '& .MuiTypography-root': {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }
                                                }}
                                            />
                                        </MUIToolTip>
                                        <Typography variant="body2" color="textSecondary">
                                            {post.views} views
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Countries Section */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Visitor Countries</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Doughnut Chart */}
                                <Box sx={{ flex: '1 1 auto' }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={processedCountries}
                                                dataKey="visits"
                                                nameKey="country"
                                                cx="50%"
                                                cy="50%"
                                                startAngle={90}
                                                endAngle={450}
                                                innerRadius={60}
                                                outerRadius={80}
                                                labelLine={{
                                                    stroke: '#666666',
                                                    strokeWidth: 1
                                                }}
                                                label={({ country, x, y }) => {
                                                    const CountryFlag = (Flags as { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> })[country];
                                                    return (
                                                        <g transform={`translate(${x},${y})`}>
                                                            <foreignObject width="20" height="15" x="-10" y="-7">
                                                                {CountryFlag && <CountryFlag />}
                                                            </foreignObject>
                                                        </g>
                                                    );
                                                }}
                                            >
                                                {processedCountries.map((entry: CountryData) => (
                                                    <Cell
                                                        key={`cell-${entry.country}`}
                                                        fill={getRandomColor(entry.country ?? 'Unknown')}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CountryTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>

                                {/* Country List */}
                                <Box
                                    sx={{
                                        width: 180,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.5,
                                        borderLeft: '1px solid',
                                        borderColor: 'divider',
                                        pl: 2,
                                        pr: 1,
                                        py: 1,
                                        maxHeight: 300,
                                        overflowY: 'auto'
                                    }}
                                >
                                    {processedCountriesSorted
                                        .slice(0, 10)
                                        .slice(0, 10)
                                        .map(country => (
                                            <Box
                                                key={country.country}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    height: 24,
                                                    py: 0.5,
                                                    px: 0.5
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        flexShrink: 0,
                                                        bgcolor: getRandomColor(country.country ?? 'Unknown')
                                                    }}
                                                />
                                                {(() => {
                                                    const FlagComponent = country.country ? (Flags as { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> })[country.country] : undefined;
                                                    return FlagComponent ? (
                                                        <Box sx={{ flexShrink: 0 }}>
                                                            <FlagComponent style={{ width: 16 }} />
                                                        </Box>
                                                    ) : null;
                                                })()}
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        flexGrow: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        minWidth: 0
                                                    }}
                                                >
                                                    {getName(country.country ?? 'Unknown')}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        ml: 'auto',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {country.percentage}%
                                                </Typography>
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>User Agents</Typography>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                maxHeight: 300,
                                overflowY: 'auto'
                            }}>
                                {processedAgents.map((agent, index) => (
                                    <MUIToolTip
                                        key={agent.user_agent ?? `agent-${index}`}
                                        arrow
                                        slotProps={{
                                            tooltip: {
                                                sx: {
                                                    bgcolor: '#3a3a3a',
                                                    '& .MuiTooltip-arrow': {
                                                        color: '#3a3a3a'
                                                    }
                                                }
                                            }
                                        }}
                                        title={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                                                {OSIcons[detectOS(agent.user_agent ?? '') as keyof typeof OSIcons]?.({
                                                    style: { color: '#fff' },
                                                    width: 40,
                                                    height: 40
                                                })}
                                                <Typography variant="caption" sx={{ color: '#fff' }}>
                                                    {agent.user_agent} ({agent.percentage}%)
                                                </Typography>
                                            </Box>
                                        }
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                py: 0.5
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            fill="none"
                                                            stroke="#eee"
                                                            strokeWidth="2"
                                                        />
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            fill="none"
                                                            stroke="#8884d8"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            transform="rotate(-90 12 12)"
                                                            strokeDasharray={`${((agent.percentage ?? 0) / 100) * (2 * Math.PI * 10)} ${2 * Math.PI * 10}`}
                                                        />
                                                    </svg>
                                                </Box>
                                                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center' }}>
                                                    {OSIcons[detectOS(agent.user_agent ?? '') as keyof typeof OSIcons] ?
                                                        OSIcons[detectOS(agent.user_agent ?? '') as keyof typeof OSIcons]({
                                                            color: 'primary.main',
                                                            width: 24,
                                                            height: 24
                                                        }) :
                                                        null
                                                    }
                                                </Box>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    flexGrow: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {agent.user_agent}
                                            </Typography>
                                            <Typography variant="caption" sx={{ flexShrink: 0 }}>
                                                {agent.percentage}%
                                            </Typography>
                                        </Box>
                                    </MUIToolTip>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Request Logs</Typography>
                            <TableContainer
                                component={Paper}
                                sx={{
                                    maxHeight: 400,
                                    border: '1px solid rgba(224, 224, 224, 1)',
                                    '& .MuiTableHead-root': {
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: 'background.paper',
                                        zIndex: 1
                                    }
                                }}
                            >
                                <Table size="small" stickyHeader sx={{ '& td, & th': { fontFamily: 'monospace' } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="15%">Date</TableCell>
                                            <TableCell width="15%">Visitor ID</TableCell>
                                            <TableCell width="20%">Page Path</TableCell>
                                            <TableCell width="40%">User Agent</TableCell>
                                            <TableCell width="5%">Country</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stats.raw_data?.map((row: RawData) => (
                                            <TableRow key={`${row.visitor_id}-${row.created_at}`}>
                                                <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</TableCell>
                                                <TableCell>{row.visitor_id}</TableCell>
                                                <TableCell>{row.page_path}</TableCell>
                                                <TableCell>{row.user_agent}</TableCell>
                                                <TableCell>
                                                    {row.country_code}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};