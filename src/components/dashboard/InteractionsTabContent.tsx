
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface HandPreferenceData {
  name: string;
  value: number;
}

interface MenuTypeData {
  name: string;
  value: number;
}

interface BlockInteractionData {
  name: string;
  value: number;
}

interface InteractionsTabContentProps {
  handPreferenceData: HandPreferenceData[];
  menuTypeData: MenuTypeData[];
  blockInteractionData: BlockInteractionData[];
  totalMenuInteractions: number;
  totalHandActions: number;
}

const COLORS = ['#9b87f5', '#7E69AB', '#f59b87', '#87f59b'];

// Menu-specific color palette
const MENU_COLORS: Record<string, string> = {
  Info: "#5C9967",   // forest-green
  Energy: "#FF9900", // vibrant orange
  Help: "#E8EFF7",   // soft lavender-gray
  Matter: "#00CCFF"  // bright cyan
};

const InteractionsTabContent = ({
  handPreferenceData,
  menuTypeData,
  blockInteractionData,
  totalMenuInteractions,
  totalHandActions
}: InteractionsTabContentProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {handPreferenceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hand Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={handPreferenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {handPreferenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 text-sm">
              Total: {totalHandActions} hand interactions
            </div>
          </CardContent>
        </Card>
      )}

      {menuTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={menuTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {/* Single Bar component with Cell components for individual colors */}
                  <Bar dataKey="value" name="Interactions">
                    {menuTypeData.map((entry) => (
                      <Cell 
                        key={entry.name} 
                        fill={MENU_COLORS[entry.name] || "#9b87f5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 text-sm">
              Total: {totalMenuInteractions} menu interactions
            </div>
          </CardContent>
        </Card>
      )}

      {blockInteractionData[0]?.value > 0 && (
        <Card className={menuTypeData.length === 0 ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>Block Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockInteractionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7E69AB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractionsTabContent;
