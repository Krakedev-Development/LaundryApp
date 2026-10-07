import {MAPBOX_ACCESS_TOKEN} from '../../config/mapbox';
import {MapboxGeoProvider} from './mapbox/MapboxGeoProvider';
import {DemoGeoProvider} from './DemoGeoProvider';
import type {GeoProvider} from './geo.types';
export const geoProvider:GeoProvider=MAPBOX_ACCESS_TOKEN?new MapboxGeoProvider({accessToken:MAPBOX_ACCESS_TOKEN,country:'EC',language:'es',permanentGeocoding:process.env.EXPO_PUBLIC_MAPBOX_PERMANENT_GEOCODING==='true'}):new DemoGeoProvider();
export const geoIsDemo=!MAPBOX_ACCESS_TOKEN;

import {RoutingService} from './RoutingService';
export const routingService=new RoutingService(geoProvider);
