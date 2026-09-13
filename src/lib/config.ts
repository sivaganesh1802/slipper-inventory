import fs from "fs";
import path from "path";
import fallbackConfig from "../../config.json";

export interface IAppConfig {
  database: {
    mongodb_uri: string;
  };
  auth: {
    jwt_secret: string;
    admin_username: string;
    admin_password: string;
  };
  app: {
    business_name: string;
    currency_symbol: string;
  };
  cloudinary?: {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  };
}

let cachedConfig: IAppConfig | null = null;
let lastReadTime = 0;

export function getAppConfig(): IAppConfig {
  const now = Date.now();
  // Cache for 2 seconds so disk reads are efficient but changes to config.json are immediately picked up
  if (cachedConfig && now - lastReadTime < 2000) {
    return cachedConfig;
  }

  try {
    const configPath = path.join(process.cwd(), "config.json");
    let parsed: any = {};
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf-8");
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn("Error parsing config.json:", e);
      }
    }

    cachedConfig = {
      database: {
        mongodb_uri:
          process.env.MONGODB_URI ||
          parsed.database?.mongodb_uri ||
          fallbackConfig.database?.mongodb_uri,
      },
      auth: {
        jwt_secret:
          process.env.JWT_SECRET ||
          parsed.auth?.jwt_secret ||
          fallbackConfig.auth?.jwt_secret,
        admin_username:
          process.env.ADMIN_USERNAME ||
          parsed.auth?.admin_username ||
          fallbackConfig.auth?.admin_username,
        admin_password:
          process.env.ADMIN_PASSWORD ||
          parsed.auth?.admin_password ||
          fallbackConfig.auth?.admin_password,
      },
      app: {
        business_name:
          process.env.BUSINESS_NAME ||
          parsed.app?.business_name ||
          fallbackConfig.app?.business_name,
        currency_symbol:
          process.env.CURRENCY_SYMBOL ||
          parsed.app?.currency_symbol ||
          fallbackConfig.app?.currency_symbol,
      },
      cloudinary: {
        cloud_name:
          process.env.CLOUDINARY_CLOUD_NAME ||
          parsed.cloudinary?.cloud_name ||
          fallbackConfig.cloudinary?.cloud_name ||
          "",
        api_key:
          process.env.CLOUDINARY_API_KEY ||
          parsed.cloudinary?.api_key ||
          fallbackConfig.cloudinary?.api_key ||
          "",
        api_secret:
          process.env.CLOUDINARY_API_SECRET ||
          parsed.cloudinary?.api_secret ||
          fallbackConfig.cloudinary?.api_secret ||
          "",
      },
    };
    lastReadTime = now;
    return cachedConfig;
  } catch (error) {
    console.warn("Could not read config from disk, falling back to bundled config:", error);
  }

  return fallbackConfig;
}

