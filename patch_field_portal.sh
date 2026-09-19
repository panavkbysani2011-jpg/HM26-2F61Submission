#!/bin/bash

# Update FieldPortal.jsx to clear the watchPosition id
sed -i 's/const \[geoError, setGeoError\] = useState('"'"''"'"');/const \[geoError, setGeoError\] = useState('"'"''"'"');\n  const \[watchId, setWatchId\] = useState(null);/' src/pages/FieldPortal.jsx

sed -i 's/if (navigator.geolocation) {/if (watchId) navigator.geolocation.clearWatch(watchId);\n      if (navigator.geolocation) {/' src/pages/FieldPortal.jsx

sed -i 's/navigator.geolocation.watchPosition(/const id = navigator.geolocation.watchPosition(/' src/pages/FieldPortal.jsx

sed -i 's/{ enableHighAccuracy: true }/{ enableHighAccuracy: true }\n          );\n          setWatchId(id);/' src/pages/FieldPortal.jsx

# Also clean up watch on unmount
sed -i 's/loadTasks();/loadTasks();\n      return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };/' src/pages/FieldPortal.jsx
