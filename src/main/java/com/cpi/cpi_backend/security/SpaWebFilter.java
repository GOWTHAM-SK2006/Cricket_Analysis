package com.cpi.cpi_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SpaWebFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        // Only handle GET requests that are non-API, non-actuator, and have no file extension (.js, .css, .png, etc.)
        if ("GET".equalsIgnoreCase(request.getMethod()) 
                && !uri.startsWith("/api") 
                && !uri.startsWith("/actuator") 
                && !uri.contains(".")) {

            // 1. Try static resource with .html (e.g. /terms -> static/terms.html)
            String cleanUri = uri.endsWith("/") ? uri.substring(0, uri.length() - 1) : uri;
            Resource htmlResource = new ClassPathResource("static" + cleanUri + ".html");
            if (htmlResource.exists() && htmlResource.isReadable()) {
                request.getRequestDispatcher(cleanUri + ".html").forward(request, response);
                return;
            }

            // 2. Try static resource with /index.html (e.g. /terms -> static/terms/index.html)
            Resource indexResource = new ClassPathResource("static" + cleanUri + "/index.html");
            if (indexResource.exists() && indexResource.isReadable()) {
                request.getRequestDispatcher(cleanUri + "/index.html").forward(request, response);
                return;
            }

            // 3. Admin sub-route fallback
            if (cleanUri.startsWith("/admin")) {
                Resource adminHtml = new ClassPathResource("static/admin/dashboard.html");
                if (adminHtml.exists() && adminHtml.isReadable()) {
                    request.getRequestDispatcher("/admin/dashboard.html").forward(request, response);
                    return;
                }
            }

            // 4. Main SPA fallback
            Resource mainIndex = new ClassPathResource("static/index.html");
            if (mainIndex.exists() && mainIndex.isReadable()) {
                request.getRequestDispatcher("/index.html").forward(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
