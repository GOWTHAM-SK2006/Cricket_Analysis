package com.cpi.cpi_backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward extensionless paths to their corresponding Next.js static exported HTML files
        registry.addViewController("/login").setViewName("forward:/login.html");
        registry.addViewController("/signup").setViewName("forward:/signup.html");
        registry.addViewController("/dashboard").setViewName("forward:/dashboard.html");
        registry.addViewController("/terms").setViewName("forward:/terms.html");
        registry.addViewController("/profile").setViewName("forward:/profile.html");
        registry.addViewController("/leaderboard").setViewName("forward:/leaderboard.html");
        registry.addViewController("/help").setViewName("forward:/help.html");
        registry.addViewController("/history").setViewName("forward:/history.html");
        registry.addViewController("/teams").setViewName("forward:/teams.html");
        registry.addViewController("/players").setViewName("forward:/players.html");
        registry.addViewController("/practice").setViewName("forward:/practice.html");
        registry.addViewController("/matches").setViewName("forward:/matches.html");
        registry.addViewController("/reports").setViewName("forward:/reports.html");
        registry.addViewController("/organization").setViewName("forward:/organization.html");

        // Admin Routes
        registry.addViewController("/admin").setViewName("forward:/admin/dashboard.html");
        registry.addViewController("/admin/").setViewName("forward:/admin/dashboard.html");
        registry.addViewController("/admin/dashboard").setViewName("forward:/admin/dashboard.html");
        registry.addViewController("/admin/terms").setViewName("forward:/admin/terms.html");
        registry.addViewController("/admin/content").setViewName("forward:/admin/content.html");
        registry.addViewController("/admin/settings").setViewName("forward:/admin/settings.html");
        registry.addViewController("/admin/organizations").setViewName("forward:/admin/organizations.html");
        registry.addViewController("/admin/coaches").setViewName("forward:/admin/coaches.html");
        registry.addViewController("/admin/players").setViewName("forward:/admin/players.html");
        registry.addViewController("/admin/assessments").setViewName("forward:/admin/assessments.html");
        registry.addViewController("/admin/analytics").setViewName("forward:/admin/analytics.html");
        registry.addViewController("/admin/help").setViewName("forward:/admin/help.html");
        registry.addViewController("/admin/cpi-framework").setViewName("forward:/admin/cpi-framework.html");
        registry.addViewController("/admin/ai").setViewName("forward:/admin/ai.html");
        registry.addViewController("/admin/reports").setViewName("forward:/admin/reports.html");
        registry.addViewController("/admin/activity").setViewName("forward:/admin/activity.html");
        registry.addViewController("/admin/versions").setViewName("forward:/admin/versions.html");
        
        // Redirect any direct GET requests to /logout back to /login page safely
        registry.addRedirectViewController("/logout", "/login");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/", "classpath:/public/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // Try resourcePath + ".html"
                        Resource htmlResource = location.createRelative(resourcePath + ".html");
                        if (htmlResource.exists() && htmlResource.isReadable()) {
                            return htmlResource;
                        }
                        // Try resourcePath + "/index.html"
                        Resource indexResource = location.createRelative(resourcePath + "/index.html");
                        if (indexResource.exists() && indexResource.isReadable()) {
                            return indexResource;
                        }
                        return null;
                    }
                });
    }
}
